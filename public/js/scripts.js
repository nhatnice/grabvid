$(document).ready(function(){ 
  //FORM SUBMIT
  $("#download-form").submit(function(e){
    if ($("#download-btn").prop("disabled")) return e.preventDefault();
    $("#download-btn").prop("disabled", true);
    //BUTTON DOWNLOAD EFFECTS
    $("#download-btn a").css({
      float: 'left',
      marginLeft: '10px'
    });

    $("#loader-circle").css({
      display: 'inline-block'
    });

    var url = '/download?url=' + encodeURIComponent(document.forms["download-form"]["link-input"].value.trim());
    location.href = url;
    e.preventDefault();
  });

  //SETUP MEDIA CLICK
  $('.materialboxed').materialbox();
})

// Fetch the file first so the button can show progress while the server prepares it.
// Only one file is prepared at a time: the whole table is locked until it finishes.
var downloading = false;
$(document).on('click', '.format-list a[download]', function (e) {
  e.preventDefault();
  if (downloading) return;
  downloading = true;
  var $a = $(this);
  var href = $a.attr('href');
  var name = new URL(href, location.href).searchParams.get('n') || 'video';
  $('.format-list').addClass('is-busy');
  $a.addClass('is-loading').text('PREPARING...');
  fetch(href)
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.blob();
    })
    .then(function (blob) {
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    })
    .catch(function () {
      alert('Download failed. Please try again.');
    })
    .finally(function () {
      $a.removeClass('is-loading').text('DOWNLOAD');
      $('.format-list').removeClass('is-busy');
      downloading = false;
    });
});
