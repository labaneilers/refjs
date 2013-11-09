/* globals require, exports */

var fs = require("fs");
var path = require("path");

var refTagRegex = (/<reference\ path\=\"(.*?)"/gim);

// Given a content file as a string, return the paths of the dependencies it references
var getDependencyPaths = function(content)
{
	var foundPaths = [];
	var match;
	while (match = refTagRegex.exec(content))
	{
		foundPaths.push(match[1]);
	}

	return foundPaths;
};

// Builds a tree of dependencies for the specified physical path.
var getTree = function(physicalPath)
{
	var dir = path.dirname(physicalPath);
	physicalPath = path.resolve(physicalPath);

	var content = fs.readFileSync(physicalPath);
	var foundPaths = getDependencyPaths(content);

	var deps = foundPaths.map(
		function(virtualPath) 
		{ 
			return getTree(path.resolve(dir, virtualPath)); 
		});

	return {
		path: physicalPath,
		dependencies: deps
	};
};

var buildDepsList = function(tree, list)
{
	for (var i=0; i<tree.dependencies.length; i++)
	{
		buildDepsList(tree.dependencies[i], list);
	}

	list.push(tree.path);
};

// Remove duplicate items from the list, with the first instance of a duplicate winning.
var dedupe = function(list)
{
	var output = [];
	var hash = {};
	for (var i=0; i<list.length; i++)
	{
		if (!hash[list[i]])
		{
			output.push(list[i]);
		}

		hash[list[i]] = true;
	}

	return output;
};

var treeToList = function(tree)
{
	var list = [];

	buildDepsList(tree, list);

	return dedupe(list);
};

exports.getTree = getTree;
exports.treeToList = treeToList;
