function matchFields(){
  var matches = $(".desired-schema .matches td");
  var $current = $(".current-schema");
  console.log(matches);

  $.each(matches, function(i,e){
    console.log(e);
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