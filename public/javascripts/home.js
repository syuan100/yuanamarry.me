$(document).ready(function() {
  var $rsvpButton = $('.rsvp-action');
  var $rsvpWindow = $('.rsvp-window');
  var $closeButton = $('.rsvp-window .close-button');

  $rsvpButton.click(function() {
    $rsvpWindow.fadeIn();
  });

  $closeButton.click(function(){
    $rsvpWindow.fadeOut();
  });

});