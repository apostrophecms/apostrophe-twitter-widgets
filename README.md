# apos-twitter

apostrophe-twitter is a widget for the [Apostrophe](http://apostrophenow.org) content management system. apostrophe-twitter lets you add a Twitter feed to any content area created with Apostrophe. apostrophe-twitter is also intended as a demonstration of how to add custom widgets to Apostrophe and enable their use in your project. See [apostrophe-sandbox](http://github.com/punkave/apostrophe-sandbox) for a project that demonstrates how to use apostrophe-twitter.

## Requirements

Due to Twitter's API access policies, you must [register a Twitter "app"](https://dev.twitter.com/) to use this module. The `consumerKey` and `consumerSecret`, `accessToken` and `accessTokenSecret` options must be set when initializing the module. After registering your app on dev.twitter.com, click "create my access token." Then refresh the page as Twitter usually fails to display the token on the first try.
nodemon## Setup

If you are using `apostrophe-site` (and you should be), adding this module is as simple as:

npm install apostrophe-twitter

And in your app.js file:

    modules: {
      ... other modules ...
      'apostrophe-twitter': {
        consumerKey: 'get',
        consumerSecret: 'your',
        accessToken: 'own',
        accessTokenSecret: 'credentials'
      },
      ... yet more modules ...
    }

Now it will be included in the default set of controls. If you are setting the `controls` option on your areas, the widget's name is `twitter`.

To insert it as a singleton, you might write:

    {{ aposSingleton(page, 'twitter', 'twitter', { limit: 3 }) }}

If you want the same feed to appear on many pages, you might use the `global` virtual page:

    {{ aposSingleton(global, 'twitter', 'twitter', { limit: 3 }) }}

## Options

### limit

The `limit` option controls the number of tweets to be displayed, at most. The `limit` option defaults to `5`.

## Displaying Profile Pictures

By default the profile picture is present but hidden by CSS. You can override this by setting the `apos-tweet-profile-image` class to `display: block` at project level. The background image of that div is the user's profile picture. Keep in mind they are only 48x48.

## aposTwitterReady

Once the tweets have been fully loaded into the template, an event called 'aposTwitterReady' fires. If you are manipulating the tweets on the front-end, you will want to listen for aposTwitterReady, rather than other DOM events. If you don't, the tweets may take a few seconds to load and your wonderful functions will fire before the tweets are accessible. You can then target the twitter widget with a simple declaration.For example:

```javascript
  $('body').on('aposTwitterReady', '.apos-widget', function() {
    $widget = $(this);
    $widget.find('.apos-tweets').makeThemMoreAwesome();
  });
```
## aposTwitterNull
If no tweets could be found, an event called 'aposTwitterNull' fires. If you want something special to happen if there are no tweets available, this is your event.

```javascript
  $('body').on('aposTwitterNull', '.apos-widget', function() {
    $widget = $(this);
    $widget.find('.apos-tweets').seeYaLaterTemplate();
  });
```

Enjoy!
