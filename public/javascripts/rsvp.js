function additionalGuests(n) {
  var $guestBox = $(".additional-guests select");
  for(var i=0; i<n; i++){
    $guestBox.append("<option value='"+ i +"'>" + i + "</option>");
  }
};

$(document).ready(function() {

});