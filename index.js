var Twitter = require('simple-twitter');
var _ = require('lodash');
var qs = require('qs');
var moment = require('moment');

module.exports = {
  label: 'Twitter',
  extend: 'apostrophe-widgets',

  beforeConstruct: function (self, options) {
    options.addFields = [
      {
        type: 'string',
        name: 'account',
        label: 'Twitter Account'
      },
      {
        type: 'string',
        name: 'hashtag',
        label: 'Filter Tweets by Hashtag'
      },
      {
        type: 'integer',
        name: 'limit',
        label: 'Limit Number of Tweets',
        def: 3
      }
    ].concat(options.addFields || []);

    options.arrangeFields = [
      {
        name: 'basics',
        label: 'Basics',
        fields: [
          'account',
          'hashtag',
          'limit'
        ]
      }
    ].concat(options.arrangeFields || []);
  },

  construct: function (self, options) {
    if (!options.consumerKey) {
      self.apos.utils.error('WARNING: you must configure the consumerKey, consumerSecret, accessToken and accessTokenSecret options to use the Twitter widget.');
    }
    var consumerKey = options.consumerKey;
    var consumerSecret = options.consumerSecret;
    var accessToken = options.accessToken;
    var accessTokenSecret = options.accessTokenSecret;

    // Set initial template as placeholder.  We
    // will render 'widget.html' after we fetch the
    // data from twitter.

    self.template = 'placeholder';

    // How long to cache the feed, in seconds. Twitter's API rate limit is
    // rather generous at 300 requests per 15 minutes. We shouldn't get anywhere
    // near that, we'd make 30 requests. However with clustering we would have
    // separate caches and this might start to look like the right setting.

    var cacheLifetime = options.cacheLifetime || 30;

    self.route('post', 'feed', function (req, res) {
      var widgetOptions = req.body || {};
      var username = self.apos.launder.string((widgetOptions.account || ''));
      var hashtag = self.apos.launder.string((widgetOptions.hashtag || ''));
      var list = widgetOptions.list ? self.apos.slugify(self.apos.launder.string(widgetOptions.list)) : false;
      var count = widgetOptions.limit || 5;
      var url;

      if (username && !username.length) {
        res.statusCode = 404;
        return res.send('not found');
      }

      // ensure hashtags have hashtags and allow multiple (maybe)
      if (hashtag) {
        hashtag = _.map(hashtag.split(' '), function (s) {
          return (s.substr(0, 1) === '#') ? s : '#' + s;
        }).join(' ');
      }

      var params;

      if (username && list) {
        url = 'lists/statuses';
        params = {
          list_id: list,
          count: count
        };
      } else if (username && !hashtag) {
        url = 'statuses/user_timeline';
        params = {
          screen_name: username,
          count: count
        };
      } else if (username && hashtag) {
        url = 'search/tweets';
        params = {
          q: 'from:' + username + ' ' + hashtag,
          count: count
        };
      } else if (hashtag && !username) {
        url = 'search/tweets';
        params = {
          q: hashtag,
          count: count
        };
      }

      params.tweet_mode = 'extended';

      return self.getTwitter(url, params, function (err, results) {
        if (err) {
          results = [];
        }
        if (results.statuses) {
          results = results.statuses;
        }
        results.forEach(tweet => {
          tweet.text = tweet.full_text;
        });
        return res.send(self.render(req, 'widget', {
          options: widgetOptions,
          tweets: results
        }));
      });
    });

    self.route('post', 'get-lists', function (req, res) {
      var username = self.apos.launder.string(req.body.username);
      var url = 'lists/ownerships';
      return self.getTwitter(url, { screen_name: username }, function (err, results) {
        if (err) {
          return res.send([]);
        } else {
          return res.send(results.lists);
        }
      });
    });

    // self.sanitizeItem = function(item) {
    //   if (item.account) {
    //     var matches = item.account.match(/\w+/);
    //     item.account = matches[0];
    //   }
    // };

    self.helpers = {
      linkifyTweetUrls: function (text) {
        return text.replace(/https?:\/\/\S+/g, function (url) {
          var urlSansPeriod = url.replace(/\.$/, '');
          if (url.match(/…$/)) {
            // Useless URL
            return '';
          }
          return '<a href="' + urlSansPeriod + '" target="blank">' + url + '</a>';
        });
      },
      linkifyTweetMentions: function (text) {
        return text.replace(/@\w+/g, function (user) {
          var result = '<a class="apos-twitter-mention" href="http://twitter.com/' + self.apos.utils.escapeHtml(user.substr(1)) + '" target="blank">' + user + '</a>';
          return result;
        });
      },
      linkifyTweetHashtags: function (text) {
        return text.replace(/#\w+/g, function (hashtag) {
          return '<a class="apos-twitter-hashtag" href="http://twitter.com/' + self.apos.utils.escapeHtml(hashtag) + '" target="blank">' + hashtag + '</a>';
        });
      },
      linkifyTweet: function (text) {
        return self.helpers.linkifyTweetMentions(
          self.helpers.linkifyTweetHashtags(
            self.helpers.linkifyTweetUrls(text)
          )
        );
      },
      getRelativeTime: function (datetime, noSuffix) {
        return moment(Date.parse(datetime)).fromNow(noSuffix);
      }
    };
    self.addHelpers(self.helpers);

    self.getReader = function () {
      if (!self.reader) {
        self.reader = new Twitter(consumerKey, consumerSecret, accessToken, accessTokenSecret);
      }
      return self.reader;
    };

    var tweetCache = {};

    self.getTwitter = function (url, params, callback) {
      params = params ? ('?' + qs.stringify(params)) : false;

      if (_.has(tweetCache, url + params)) {
        var cache = tweetCache[url + params];
        var now = (new Date()).getTime();
        if (now - cache.when > cacheLifetime * 1000) {
          delete tweetCache[url + params];
        } else {
          return callback(null, JSON.parse(cache.results));
        }
      }
      return self.getReader().get(url, params, function (err, results) {
        if (err) {
          self.apos.utils.error('error:', err);
          return callback(err);
        }
        tweetCache[url + params] = {
          when: (new Date()).getTime(),
          results: results
        };
        return callback(null, JSON.parse(results));
      });
    };

    self.pushAsset('stylesheet', 'always', { when: 'always' });
  }
};
