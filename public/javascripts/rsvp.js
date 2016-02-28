function additionalGuests(n) {
  var $guestBox = $(".additional-guests select");
  for(var i=0; i<(n + 1); i++){
    $guestBox.append("<option value='"+ i +"'>" + i + "</option>");
  }
  if($guestBox.find("option").length > 1)
    $(".additional-guests").show();
};

$(document).ready(function() {
  var $mealForm = $(".meal-form").html();
  $(".additional-guests select").change(function(){
    var additionalSelections = $(this).val();
    $(".form.meal-selection").empty();
    for(var j=0; j < (parseInt(additionalSelections) + 1); j++) {
      $(".form.meal-selection").append($mealForm);
    }
  });

  $(".rsvp-submit").click(function(){
    var error = false;
    var errorMessage = "Please fill out the entire form.";

    if (!$("input[name='attendance']:checked").val()) {
      error = true;
    }

    $.each($(".meal-form"), function(i, e) {
      if(!$($(e).find(".meal-name")).val()) {
        error = true;
      }
      if(!$($(e).find("input[name='meal-selection']:checked")).val()) {
        error = true;
      }
    });

    console.log(error);

  });

});