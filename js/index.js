
var $toolsElem = $("#tools");
var $descriptionElem = $('#description');
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
 * @params {Object} list - List of tool objects
 */
function renderTools(list) {
    var $toolList = $("<ul></ul>");
    var itemString = '<a data-url="%URL%" draggable="true" ondragstart="drag(event)" class="collection-item">%X-Epidia-Tool-Name%</a>';
    $.each(list, function(i, tool){
        var toolItem = itemString.replace(/%[^%]+%/g, function(key){
            return tool[key.slice(1, -1)];
        });
        $toolList.append(toolItem);
    });
    $toolsElem.append($toolList);
}

/**
 * Render tool descriptions
 *
 * @params {Object} description - javascript object of the tool to render
 */
function renderDescription(description) {
    var $list = $('<ul></ul>');
    var itemString = '<li class="collection-item"><span class="key">%KEY%:</span>%VAL%</li>';
    var $objList = $('<ul class="obj-list"></ul>');
    var objectString  = '<div class="object"><span class="key">%KEY%:</span></div>';

    for (var key in description) {
        if ($.isPlainObject(description[key])) {
            if (key == "argument") {
                continue;
            } else {
                var objItem = objectString.replace(/%[^%]+%/g, function(match) {
                    if (match == "%KEY%") {
                        return key;
                    }
                });
                $objList.append(objItem);
                $objList.append(renderDescription(description[key]));
                $list.append($objList);
            }
        } else {
            var item = itemString.replace(/%[^%]+%/g, function(match) {
                if (match == "%KEY%") {
                    return key;
                } else {
                    return description[key];
                }
            });
            $list.append(item);
        }
    }
    return $list;
}

/**
 * Parsed the description of a tool from it's url
 *
 * @params {string} url - url of tool to render
 * @returns {Object} toolDescription - javascript object of tool description
 */
function parseToolDescription(url) {
    $.get(url, function(response){
        var xmlDoc = $.parseXML(response);
        var $xml = $(xmlDoc);
        var tool = $xml.find('tool');

        var description = parseDescription(tool);
        $descriptionElem.empty();
        $descriptionElem.append(renderDescription(description));
    });
}

/**
 * Recursively parses the tool xml tag.
 *
 * @params {Object} toolXml - xml object of tool tag
 * @returns {Object} description - javascript object of tool tag
 */
function parseDescription(toolXml) {
    var description = {};

    // If root element, get tool name
    if (typeof toolXml[0] != "undefined")  {
        description.name = toolXml[0].getAttribute('name');
    }

    $(toolXml).children().each(function(i, elem){
        if (elem.childElementCount > 0) {
            if (elem.hasAttribute('name')) {
                description[elem.getAttribute('name')] = parseDescription(elem);
            } else {
                description[elem.tagName] = parseDescription(elem);
            }
        } else {
            description[elem.tagName] = $(elem).text();
        }
    });
    return description;
}

/**
 * Provide drag and drop functionality for items in tool list
 *
 * @params {Object} ev - event object
 */
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.getAttribute('data-url'));
}

function drop(ev) {
    ev.preventDefault();
    var url = ev.dataTransfer.getData("text");
    description = parseToolDescription(url);
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
