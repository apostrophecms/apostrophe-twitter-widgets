apos.define('apostrophe-twitter-widgets', {
  extend: 'apostrophe-widgets',
  construct: function(self, options) {
    self.play = function($widget, data, options) {

      $.post('/modules/apostrophe-twitter-widgets/feed', data)
        .done(function(data) {
          $('[data-apos-twitter-contents]').html(data).addClass('loaded');
          $widget.trigger('aposTwitterReady');
        });

    };
  }
});
