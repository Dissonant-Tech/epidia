var toolList = [];

/**
 * Parses tool element
 *
 * @params {Object} el - Element
 * @returns {Object} tool - Tool object
 */
function parseTool(elem) {
  var currTool = {};
  var key, val;

  $.each(elem.childNodes, function(i, el){
    if (el.tagName == "DT") {
      key = el.innerText;
    } else if (el.tagName == "DD") {
      val = el.innerText;
      currTool[key] = val;
    }
  });
  return currTool;
}

/**
 * Renders Tool objects in ul element
 *
 * @params {Object} tools - Element with id tools
 * @params {Object} toolList - List of tool objects
 */
function renderTools(list) {
  var $toolElem = $("#tools");
  var $toolList = $("<ul></ul>");
  var itemString = '<li><a href="%URL%">%X-Epidia-Tool-Name%</a></li>';
  $.each(list, function(i, tool){
    var toolItem = itemString.replace(/%[^%]+%/g, function(key){
      console.log(key);
      return tool[key.slice(1, -1)];
    });
    $toolList.append(toolItem);
  });
  $toolElem.append($toolList);
}

$.get("epidia/tools/index.html", function(response){
  var html = $.parseHTML(response);

  //NOTE: Could also match tags whos tagname is 'dt',
  $.each(html, function(i, el) {
    // Only need elements with an ID
    if (typeof el.id != "undefined") {
      // Who's IDs start with "/tools/"
      if (el.id.indexOf("/tools/") === 0) {
        var tool = parseTool(el);
        toolList.push(tool);
      }
    }
  });
  // Sort by X-Epidia-Tool-Name
  toolList.sort(function(a, b) {
    if (a["X-Epidia-Tool-Name"] < b["X-Epidia-Tool-Name"]) {
      return -1;
    }
    if (a["X-Epidia-Tool-Name"] > b["X-Epidia-Tool-Name"]) {
      return 1;
    }
    return 0;
  });
  renderTools(toolList);
});
