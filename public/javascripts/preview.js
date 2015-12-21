$(document).ready(function(){
  var populateEmailList = function(data){
    $.each(data, function(i, e){
      $("#final-emails").append("<option id=" + e.id + ">" + e.name + " (" + e.email + ")</option>");
    });
  };

  /* initial load */
  $("input[value='general']").click();

  /* populate select field */
  $.ajax({
    url: "/admin/api/sendees",
    success: function(data) {
      populateEmailList(data);
    },
    error: function(xhr, status, error) {
      console.log(xhr);
      console.log(status);
      console.log(error);
    }
  });

});