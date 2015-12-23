$(document).ready(function(){
  $(".cell.delete.remove").click(function(){
    var userEmail = $(this).parent().find(".email").text();
    var userName = $(this).parent().find(".name").text();

    $(".preview-container").fadeIn();
    $(".delete-row .name").text(userName);
    $(".delete-row .email").text(userEmail);
  });

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
    if ($(e).text().match('Opened') > -1) {
      $(e).addClass("opened");
    }

    if ($(e).text().match('Sent') > -1) {
      $(e).addClass("sent");
    }
  });

});