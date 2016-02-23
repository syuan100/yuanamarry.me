function initRsvpButton(){
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
}

$(document).ready(function() {
  initRsvpButton();

  $(".submit-button").click(function(){
    var email = $("input.email").val();
    var passcode = $("input.passcode").val();
    var code = email + "|" + passcode;

    code = base32.encode(code);

    window.location = "/rsvp?code=" + code;
  });

});