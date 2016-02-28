function additionalGuests(n) {
  var $guestBox = $(".additional-guests select");
  for(var i=0; i<(n + 1); i++){
    $guestBox.append("<option value='"+ i +"'>" + i + "</option>");
  }
  if($guestBox.find("option").length > 1)
    $(".additional-guests").show();
};

function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

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
    $(".error-message").hide();

    if (!$("input[name='attendance']:checked").val()) {
      error = true;
    }

    var mealChoices = "";

    $.each($(".meal-form"), function(i, e) {
      if(!$($(e).find(".meal-name")).val()) {
        error = true;
      } else {
        mealChoices += $($(e).find(".meal-name")).val() + "|";
      }

      if(!$($(e).find("input[name='meal-selection']:checked")).val()) {
        error = true;
      } else {
        mealChoices += $($(e).find("input[name='meal-selection']:checked")).val() + "&";
      }
    });

    var rsvpData = {
      rsvp: $("input[name='attendance']:checked").val(),
      additional_guests: $(".additional-guests select").val(),
      meal_choices: mealChoices,
      email: base32.decode(getUrlVars.code).split("|")[0]
    }

    if (error) {
      $(".error-message").show();
    } else {
      $.ajax({
        url: "/rsvp-submit/",
        method: "POST",
        data: rsvpData,
        success: function(data){
          console.log(data);
        },
        error: function(err) {
          console.log(err);
        }
      });
    }

  });

});