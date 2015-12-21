var populateEmailList = function(data){
  console.log(data);
};

$(document).ready(function(){
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