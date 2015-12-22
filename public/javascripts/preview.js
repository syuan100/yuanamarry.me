$(document).ready(function(){
  var $finalEmails = $("#final-emails");

  var populateEmailList = function(data){
    $.each(data, function(i, e){
      $finalEmails.append("<option id=" + e.id + ">" + e.name + " (" + e.email + ")</option>");
    });
  };

  var sendeeCall = function(type) {
    $.ajax({
      url: "/admin/api/sendees?type=" + type,
      success: function(data) {
        populateEmailList(data);
      },
      error: function(xhr, status, error) {
        console.log(xhr);
        console.log(status);
        console.log(error);
      }
    });
  };

  /* initial load */
  $("input[value='general']").click();

  /* populate select field */
  sendeeCall("general");

  $("input[value='custom']").click(function(){
    $finalEmails.empty();
  });

  $("input[value='std'").click(function(){
    $finalEmails.empty();
    sendeeCall("std");
  });

  $("input[value='invitation'").click(function(){
    $finalEmails.empty();
    sendeeCall("invitation");
  });

  $("input[value='general'").click(function(){
    $finalEmails.empty();
    sendeeCall("general");
  });

  /* Send Preview */
  $(".send-preview-button").click(function(){
    $(".preview-container").fadeIn();
  });

  $(".cancel-preview-email-button").click(function(){
    $(".preview-container").fadeOut();
  });

});