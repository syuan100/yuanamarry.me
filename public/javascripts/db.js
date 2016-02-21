function matchFields(){
  var matches = $(".desired-schema .matches");
  var $current = $(".current-schema");

  $.each(matches, function(i,e){
    if($current.find(e).length) {
      $(".desired-schema").find(e).text("TRUE");
    } else {
      $(".desired-schema").find(e).text("FALSE");
    }
  });
}

$(document).ready(function() {
  matchFields();
});