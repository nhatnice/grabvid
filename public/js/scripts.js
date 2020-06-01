$(document).ready(function(){ 
  //FORM SUBMIT
  $("#download-form").submit(function(e){
    //BUTTON DOWNLOAD EFFECTS
    $("#download-btn a").css({
      float: 'left',
      marginLeft: '10px'
    });

    $("#loader-circle").css({
      display: 'inline-block'
    });

    var url = '/' + document.forms["download-form"]["link-input"].value;
    url = url.replace(/[/:.]/g,".");
    url = url.replace("?v=", "$")
    location.href = url;
    e.preventDefault();
  });

  //SETUP MEDIA CLICK
  $('.materialboxed').materialbox();
})