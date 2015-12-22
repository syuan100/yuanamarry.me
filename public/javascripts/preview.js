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

  $(".send-preview-email-button").click(function(){
    $(".box").hide();
    $(".sending-box").show();

    var emailObject = {
      email: $("input#preview-email").val(),
      html: $(".html-preview").html(),
      subject: $("h1.subject").text()
    };

    console.log(JSON.stringify(emailObject));

    $.ajax({
      url: "/admin/api/sendemail",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(emailObject),
      success: function(data){
        console.log(data.success);
        if (data.success === "yes") {
          $(".box").hide();
          $(".success-box").show();
        }
      },
      error: function(xhr, status, error) {
        $(".box").hide();
        $(".error-box").show();
      }
    });
  });

});