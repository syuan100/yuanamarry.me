$(document).ready(function() {
  var $rsvpButton = $('.rsvp-action');
  var $rsvpWindow = $('.rsvp-window');

  $rsvpButton.click(function() {
    $rsvpWindow.fadeIn();
  });
});