var going = false;

function additionalGuests(n) {
  var $guestBox = $(".additional-guests select");
  for(var i=1; i<(n + 2); i++){
    $guestBox.append("<option value='"+ i +"'>" + i + "</option>");
  }
  if($guestBox.find("option").length > 1)
    $(".additional-guests").show();
};

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function addRsvpForms(number) {
  if(number === NaN || number < 1) {
    number = 0;
  }
  var $mealForm = $(".meal-form")[0].outerHTML;
  $(".form.meal-selection").empty();
  for(var j=0; j < (parseInt(number)); j++) {
    $(".form.meal-selection").append($mealForm);
  }
  for(var k=0; k < ($(".meal-form").length); k++) {
    $.each($($(".meal-form")[k]).find(".meal-selection-radio"), function(i,e){
      $(e).attr("name", "meal-selection-" + k);
    });
  }

  if($(".attendance-choice[value='no']:checked").length) {
    $('.rsvp-yes').hide();
    going = false;
  }

}

function setRsvp(rsvp, additional_guests, meal_choices){
  $(".rsvp h1").text("Edit RSVP");

  additional_guests = parseInt(additional_guests);
  var val_guests = additional_guests - 1;
  $("input.attendance-choice[value='" + rsvp + "']").prop("checked", true);
  if($("input.attendance-choice[value='yes']").prop("checked") === true)
    going = true;
  $(".additional-guests select option[value='" + val_guests + "']").prop("selected", true);
  addRsvpForms(additional_guests);
  var mealPeople = meal_choices.split("&amp;");

  for(var k=0; k < ($(".meal-form").length); k++) {
    var mealName = mealPeople[k].split("|")[0];
    var mealChoice = mealPeople[k].split("|")[1];
    $($(".meal-form")[k]).find(".meal-name").val(mealName);
    $($(".meal-form")[k]).find(".meal-selection-radio[value='" + mealChoice + "']").prop("checked", true);
  }

}

$(document).ready(function() {
  $(".reload").click(function() {
    window.location.reload();
  });

  $(".attendance-choice[value='no']").click(function() {
    $('.rsvp-yes').hide();
    going = false;
  });

  $(".attendance-choice[value='yes']").click(function() {
    $('.rsvp-yes').show();
    going = true;
  });

  $(".additional-guests select").change(function(){
    var additionalSelections = $(this).val();
    addRsvpForms(additionalSelections);
  });

  $(".rsvp-submit").click(function(){
    var error = false;
    $(".error-message").hide();

    if (!$("input[name='attendance']:checked").val()) {
      error = true;
    }

    var mealChoices = "";

    $.each($(".meal-form"), function(i, e) {
      if($("input[name='attendance']:checked").val() == 'yes') {
        if(!$($(e).find(".meal-name")).val()) {
          error = true;
        } else {
          mealChoices += $($(e).find(".meal-name")).val() + "|";
        }

        if(!$($(e).find("input.meal-selection-radio:checked")).val()) {
          error = true;
        } else {
          mealChoices += $($(e).find("input.meal-selection-radio:checked")).val() + "&";
        }
      } else if($("input[name='attendance']:checked").val() == 'no') {
        mealChoices = "";
      }
    });

    var addGuests = $(".additional-guests select").val();
    if (!going)
      addGuests = -1;

    var rsvpData = {
      rsvp: $("input[name='attendance']:checked").val(),
      additional_guests: addGuests,
      meal_choices: mealChoices,
      email: base32.decode(getParameterByName("code")).split("|")[0]
    }

    if (error) {
      $(".error-message").show();
    } else {
      $.ajax({
        url: "/rsvp-submit/",
        method: "POST",
        data: rsvpData,
        success: function(data){
          $(".rsvp .form-content").empty();
          $(".rsvp .finished").show();
        },
        error: function(err) {
          $(".rsvp .form-content").empty();
          $(".rsvp .error").show();
        }
      });
    }

  });

});