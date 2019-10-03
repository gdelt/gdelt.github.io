
var msg = "GIVE IT A NAME.\n\n\
This gets the data for the current GDELT query to compare against\n\
data for other queries. Give it a name to distinguish it.\n\n\
You can also:\n\
■ Overwrite an existing dataset by using the same name.\n\
■ Remove an existing dataset by using its name prefixed with '-' (hyphen)\n\n";

// close Add modal on enter key
$("#compareName").keyup(function(event) { if (event.keyCode === 13) { $("#compareAddModalOK").click(); } });
// focus on text box when modal opens
$('#compareAddModal').on('shown.bs.modal', function () { $("#compareName").focus(); })

// appends details of layers currenty in memory to Add modal, with respective command shortcuts
function add_layers() {
  $('#compareLayers').empty();
  var prompt_sug = [query.query, query.imagetag, query.theme, query.sourcecountry, query.sourcelang, query.domain].join(',').replace(/([,]+$)|(^[,]+)/gi, '').replace(/[,]+/gi, ',') ;
  $('#compareName').val(prompt_sug); // suggested name
  var datakeys = Object.keys(datasets);
  if(datakeys.length == 0) { $('#compareLayers').append("<li>No layers are currently saved</li>"); }
  for(var i=0; i<datakeys.length; i++) {
    var url_txt = datasets[datakeys[i]].url.replace(/.*query=/g, 'query=').replace(/&format=[a-zA-Z]+/gi, ''); // remove URL root and format arg
    var url = $("<div></div>").text(url_txt).html(); // JQuery hack to escape html special chars
    var layer_replace = ' <a style="cursor: pointer;" type="button" tabindex="0" onclick="$(\'#compareName\').val(\'' + datakeys[i] + '\')"> replace </a>';
    var layer_remove = ' <a style="cursor: pointer;" type="button" tabindex="1" onclick="$(\'#compareName\').val(\'-' + datakeys[i] + '\')"> remove </a>';
    var new_layer = '<li><b>\'' + datakeys[i] + '\': </b>(<i>' + url + '</i>)' + layer_replace + layer_remove + '</li>';
    $('#compareLayers').append(new_layer);
  }
}

// Interpret name from compareAddModal modal, and add/replace/remove data as appropriate
function add_dataset(x) {
  var datakeys = Object.keys(datasets);
  dataname = x;
  if(dataname === null){ alert('cancelled'); return; } // add data cancelled
  if(dataname[0] === '-') {        // remove an entry
		if(datakeys.indexOf(dataname.substr(1)) == -1) { alert('Data layer "' + dataname.substr(1) + '"' + 'not found.\nPlease check your spelling.')
		} else {
			delete datasets[ dataname.substr(1) ];
			document.getElementById("analysis_datacount").innerHTML = Object.keys(datasets).length;
		}
  } else {
    // get the data
    if(VERBOSE) { clog('getting data for ' + API_URL); }
    $.ajax({
      url: API_URL.replace(/&format=[a-zA-Z]+/gi, '') + '&format=json', // ensure correct format argument
      type: 'GET',
      dataType: 'json',
      error: function(err) { if(VERBOSE) { clog('ajax call fail: ' + err); }},
      success: function(options) {
        datasets[dataname] = { 'name': dataname, 'url': c(API_URL).replace(/&format=json/gi, ''), 'data': options };
        if(VERBOSE) { clog('comp data added for: ' + dataname); }
        $('#analysis_buttons_div').toggleClass('active');
        setTimeout(function () { $('#analysis_buttons_div').toggleClass('active'); }, 500);
				document.getElementById("analysis_datacount").innerHTML = Object.keys(datasets).length;
    	},
    });
  }
}

// on 'View' click
function action_analysis() {
  // update hash
  var hash = 'compare&';
  var datakeys = Object.keys(datasets);
  for(var i=0; i<datakeys.length; i++) { hash += datakeys[i].replace(/:/g, '-') + '=' + encodeURIComponent(datasets[datakeys[i]].url) + '&'; }
  location.href = '#' + hash.replace(/&$/g, '').replace(/ /gi, '%20'); // remove last joiner '&' and change spaces to %20
  // update title and call the compare template
  var title = 'Compare: ' + Object.keys(datasets).join(', ');
  $("#iframe_title").text(title);
  iframe_zoom(2);
  $("#gdelt_iframe").attr("src", 'timeline.html');
}

// on 'X' click
function clear_analysis() {
  datasets = {};
  document.getElementById("analysis_datacount").innerHTML = '0';
  console.log('datasets cleared ' + datasets);
}
