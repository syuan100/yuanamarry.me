$(document).ready(function(){
  var populateEmailList = function(data){
    $.each(data, function(i, e){
      $("#final-emails").append("<option id=" + e.id + ">" + e.name + " (" + e.email + ")</option>");
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
    $("#final-emails").empty();
    $("#final-emails").prop('disabled', 'disabled');
  });

  $("input[value='std'").click(function(){
    sendeeCall("std");
    $("#final-emails").prop('disabled', false);
  });

  $("input[value='invitation'").click(function(){
    sendeeCall("invitation");
    $("#final-emails").prop('disabled', false);
  });

  $("input[value='general'").click(function(){
    sendeeCall("general");
    $("#final-emails").prop('disabled', false);
  });

});