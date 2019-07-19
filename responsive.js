// Manages iframe zoom functionality and responsive panel re-sizing

// cookie functions remember app zoom settings - one for GDELT one for Compare tool
// both settings are saved together in a JSON string to cookie 'zoom' argument

function saveCookie() {
  var d = new Date();
  d.setTime(d.getTime() + (30*24*60*60*1000)); // 30 days expiry
  var expires = "expires="+ d.toUTCString();
  cookie_json = '{ "zoom": ' + scale + ', "compzoom": ' + comp_scale + '}';
  document.cookie = "zoom=" + cookie_json + ";" + expires + ";path=/";
}

function readCookie() {
  var cookie = {};
  var cookie_array = document.cookie.split(';');
  for(var i=0; i<cookie_array.length; i++) {
    cookie_arg = cookie_array[i].split('=');
    cookie[cookie_arg[0].trim()] = cookie_arg[1];
  }
  if(!cookie.zoom) return;
  return JSON.parse(cookie.zoom);
}

// iframe zoom functionality
var dw = 1;  var dh = 1;
var dwc = 1; var dhc = 1;
var scale = 1;         // main gdelt iframe scaler
var comp_scale = 1;    // scale for compare scaler

var cookie = readCookie();
if(typeof cookie !== 'undefined') { if(cookie.zoom) {
  scale = cookie.zoom;
  if(scale == NaN) scale = 1; // safeguard
  dw = 1/cookie.zoom;
  dh = 1/cookie.zoom;
  comp_scale = cookie.compzoom;
  dwc = 1/cookie.compzoom;
  dhc = 1/cookie.compzoom;
}}

// rescale iframe based on zoom keys
// separate zoom settings for GDELT and Compare iframes
function iframe_zoom(x) {
  var comp_mode = /^Compare/.test($('#iframe_title').text()); // true if on Compare screen
  if(VERBOSE) { clog('iframe_zoom ' + comp_mode); }
  var x = [1/1.1, 1.1, 1][x];  // x is a zoom code: 0:out, 1:in, 2:no change
  var w = $('#iframe_container').width();
	var h = $('#iframe_container').height();
  if(comp_mode){ // adjust appropriate scaler
    comp_scale *= x;
    dwc /= x; dhc /= x;
    $("#gdelt_iframe").width(dwc * w + "px");
  	$("#gdelt_iframe").height(dhc * h + "px")
  	$('#gdelt_iframe').css('transform', `scale(${comp_scale})`);
  } else {
    scale *= x;
    dw /= x; dh /= x;
    $("#gdelt_iframe").width(dw * w + "px");
  	$("#gdelt_iframe").height(dh * h + "px")
  	$('#gdelt_iframe').css('transform', `scale(${scale})`);
  }
  if(x != 1) { saveCookie(); } // update cookie if zoom changed
}

// If browser window is resized this recalculates panel sizes so page can work without refresh
function resize_panels() {
  if(VERBOSE) { clog('resize_panels'); }
  // iframe_zoom(2);
  var w = window.innerWidth;
  var h = window.innerHeight;
  var n = $('nav').outerHeight();
  var t = $('#main_panel_title_row').outerHeight();
  if(w <= 767) {
    $('#side_panel').outerHeight('auto');
    $('#iframe_container').width(w + 'px');
    $('#iframe_container').height(h - t + 'px');
  } else {
    $('#side_panel').outerHeight(h - n + 'px');
    $('#iframe_container').width(w * 2/3 + 'px');
    $('#iframe_container').height(h - n - t + 'px');
  }
  iframe_zoom(2);
}

// event listeners
resize_panels();
$( window ).resize(function() { resize_panels(); });

