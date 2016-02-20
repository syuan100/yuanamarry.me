$(document).ready(function() {
  var $rsvpButton = $('.rsvp-action');
  var $rsvpWindow = $('.rsvp-window');
  var $closeButton = $('.rsvp-window .close-button');
  var $emailField = $('input.email');
  var $passField = $('input.passcode');

  $rsvpButton.click(function() {
    $rsvpWindow.fadeIn(function() {
      $emailField.focus();
    });
  });

  $closeButton.click(function(){
    $rsvpWindow.fadeOut();
  });

});