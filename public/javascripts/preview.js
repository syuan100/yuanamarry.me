$(document).ready(function(){
  var $finalEmails = $("#final-emails");

  var populateEmailList = function(data){
    $.each(data, function(i, e){
      $finalEmails.append("<option id=" + e.id + " data-name='" + e.name + "' data-email='" + e.email + "'>" + e.name + " (" + e.email + ")</option>");
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
  var createEmailObject = function(email, html, subject) {
    var object = {
      email: email,
      html: html,
      subject: subject
    }

    return object;
  };

  $(".send-preview-button").click(function(){
    $(".preview-container").fadeIn();
  });

  $(".cancel-preview-email-button").click(function(){
    $(".preview-container").fadeOut();
  });

  $(".send-preview-email-button").click(function(){
    $(".box").hide();
    $(".sending-box").show();

    var emailObject = createEmailObject($("input#preview-email").val(), $(".html-preview").html(), $("h1.subject").text());

    console.log(JSON.stringify(emailObject));

    $.ajax({
      url: "/admin/api/sendemail",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(emailObject),
      success: function(data){
        $(".box").hide();
        $(".success-box").show();
      },
      error: function(xhr, status, error) {
        $(".box").hide();
        $(".error-box").show();
      }
    });
  });

  /* Send Final Email */
  $(".send-mail-button").click(function(){
    var recipients = $finalEmails.find("option");
    var successfulEmails = [];
    var failedEmails = [];
    var totalProcessed = 0;
    $(".preview-container").fadeIn();
    $(".box").hide();
    $(".final-send").show();
    $.each(recipients, function(i,e) {
      var finalEmailObject = createEmailObject($(e).attr("data-email"), $(".html-preview").html(), $("h1.subject").text());
      $.ajax({
        url: "/admin/api/sendemail",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(finalEmailObject),
        success: function(data){
          successfulEmails.append($(e).attr("data-email"));
          $(".results-box").append("<span class='success'>" + $(e).attr("data-email") + "</span>");
          totalProcessed++;
          if (totalProcessed == (recipients.length - 1)) {
            $(".results-box").before("Finished!");
          }
        },
        error: function(xhr, status, error) {
          failedEmails.append($(e).attr("data-email"));
          $(".results-box").append("<span class='error'>" + $(e).attr("data-email") + "</span>");
          totalProcessed++;
          if (totalProcessed == (recipients.length - 1)) {
            $(".results-box").before("Finished!");
          }
        }
      });
    });
  });

});