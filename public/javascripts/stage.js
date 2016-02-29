$(document).ready(function(){
  $(".cell.delete.remove").click(function(){
    var userEmail = $(this).parent().find(".email").text();
    var userName = $(this).parent().find(".name").text();

    $(".preview-container").fadeIn();
    $(".delete-row .name").text(userName);
    $(".delete-row .email").text(userEmail);
  });

  var totalRSVP = 0;
  $.each($(".used-spots:not(:empty)"), function(i,e) {
    totalRSVP += parseInt($(e).text());
  });
  $(".total-rsvp").text(totalRSVP);

  $(".delete-row .delete-record").click(function(){
    $.ajax({
      url: "/admin/api/delete",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ email: $(".delete-row .email").text()}),
      success: function(data){
        console.log("successful delete");
        window.location.href = "/admin/stage";
      },
      error: function(xhr, status, error){
        console.log(error);
        $(".box").hide();
        $(".delete-row-error").show();
      }
    });
  });

  $(".delete-row .cancel").click(function(){
    $(".preview-container").fadeOut();
  });

  $.each($(".cell.std, .cell.invitation"), function(i, e){
    if ($(e).text().indexOf('Opened') > -1) {
      $(e).addClass("opened");
    }

    if ($(e).text().indexOf('Sent') > -1) {
      $(e).addClass("sent");
    }
  });

  $(".generate-code-button").click(function(){
    $.ajax({
      method: "POST",
      url: "/admin/db/generate-codes",
      success: function(data) {
        console.log(data);
      }
    });
  });

  $(".row .name").click(function(){
    var $detailPane = $(".person-detail");
    var $parentRow = $(this).parents(".row");
    $detailPane.find(".content").html("<h3>Name</h3>" +
      $parentRow.find(".name").text() +
      "<h3>Email</h3>" +
      $parentRow.find(".email").text() +
      "<h3>Passcode</h3>" +
      $parentRow.find(".passcode").text() +
      "<h3>Additional Spots</h3>" +
      $parentRow.find(".additional-spots").text() +
      "<h3>Meal Choices</h3>" +
      $parentRow.find(".meal-choices").text()
      );
    $detailPane.show();
  });

  $(".person-detail .close").click(function(){
    $(".person-detail").hide();
  });

});