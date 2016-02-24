function additionalGuests(n) {
  var $guestBox = $(".additional-guests select");
  for(var i=0; i<(n + 1); i++){
    $guestBox.append("<option value='"+ i +"'>" + i + "</option>");
  }
  if($guestBox.find("option").length)
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
});