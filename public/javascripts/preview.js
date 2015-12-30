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
  var createEmailObject = function(email, html, subject, type) {
    var object = {
      email: email,
      html: html,
      subject: subject,
      emailType: type
    }

    return object;
  };

  $(".send-preview-button").click(function(){
    $(".preview-container").fadeIn();
  });

  $(".cancel-preview-email-button").click(function(){
    if ($(this).hasClass("home")){
      window.location.href = "/admin/stage";
    } else {
      $(".preview-container").fadeOut();
    }
  });

  $(".send-preview-email-button").click(function(){
    $(".box").hide();
    $(".sending-box").show();

    var emailObject = createEmailObject($("input#preview-email").val(), $(".html-preview").html(), $("h1.subject").text(), "preview");

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
    $(".preview-container").fadeIn();
    $(".box").hide();
    $(".final-send-confirmation").show();
    $(".final-send-confirmation .number").text($finalEmails.find("option").length);
  });

  $(".final-send-button").click(function(){
    var recipientsOptions = $finalEmails.find("option");
    var recipientsFunction = function(){
      var emailArray = [];
      $.each(recipientsOptions, function(i,e){
        emailArray.push($(e).attr("data-email"));
      });
      return emailArray;
    }
    var emailType = $("input[name='sendees']:checked").val();
    var successfulEmails = [];
    var failedEmails = [];
    var totalProcessed = 0;
    $(".box").hide();
    $(".final-send").show();
    if(emailType == "custom"){
      var recipients = $("input[name='custom-emails']").split(",");
    } else {
      var recipients = recipientsFunction();
    }
    $.each(recipients, function(i,e) {
      var finalEmailObject = createEmailObject(e, $(".html-preview").html(), $("h1.subject").text(), emailType);
      $.ajax({
        url: "/admin/api/sendemail",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(finalEmailObject),
        success: function(data){
          successfulEmails.push($(e).attr("data-email"));
          $(".results-box").append("<div class='success-text'>" + $(e).attr("data-email") + "</span>");
          totalProcessed++;
          if (totalProcessed == (recipients.length)) {
            $(".results-box").before(totalProcessed + " Processed! <span class='success-text'>" + successfulEmails.length + " Sent</span>, <span class='error-text'>" + failedEmails.length + " Failed</span>");
          }
        },
        error: function(xhr, status, error) {
          failedEmails.push($(e).attr("data-email"));
          $(".results-box").append("<div class='error-text'>" + $(e).attr("data-email") + "</span>");
          totalProcessed++;
          if (totalProcessed == (recipients.length)) {
            $(".results-box").before(totalProcessed + " Processed! <span class='success-text'>" + successfulEmails.length + " Sent</span>, <span class='error-text'>" + failedEmails.length + " Failed</span>");
          }
        }
      });
    });
  });

});