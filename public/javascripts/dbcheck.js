function matchFields(){
  var matches = $(".desired-schema .matches td");
  var $current = $(".current-schema");

  $.each(matches, function(i,e){
    var currentClass = $(e).attr('class');
    if($current.hasClass(currentClass)) {
      $(".desired-schema").find(e).text("TRUE");
    } else {
      $(".desired-schema").find(e).text("FALSE");
    }
  });
}

$(document).ready(function() {
  matchFields();
});