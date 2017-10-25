apos.define('apostrophe-twitter-widgets', {
  extend: 'apostrophe-widgets',
  construct: function (self, options) {
    self.play = function ($widget, data, options) {
      self.html('feed', data, function (data) {
        $widget.find('[data-apos-twitter-contents]').html(data).addClass('loaded');
        $widget.trigger('aposTwitterReady');
      });
    };
  }
});
