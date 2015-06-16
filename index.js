'use strict';

var fs = require('fs');

/**
 * Simple service for fetching HAControl status.
 *
 * @constructor
 * @author Ulrik Augustsson
 */
var HAControl = function(localPath, globalPath)
{
	if (!(this instanceof HAControl))
	{
		return new HAControl(localPath, globalPath);
	}

    this.localHa = true;
    this.globalHa = true;

	this.localPath = localPath;
	this.globalPath = globalPath;
};

module.exports = HAControl;

/**
 * Initializes the HAControl instance.
 */
HAControl.prototype.initialize = function()
{
    var localPath = this.localPath;
    var globalPath = this.globalPath;

	var localCallback = function(active)
	{
		this.localHa = active;
	}
	var globalCallback = function(active)
	{
		this.globalHa = active;
	}

    if (localPath)
    {
        checkHa(localPath, true, localCallback.bind(this));
        fs.watchFile(localPath, {persistent: true, interval: 1000}, function (current, previous)
    	{
    		if (current.mtime !== previous.mtime)
    		{
    			checkHa(localPath, false, localCallback.bind(this));
    		}
    	}.bind(this));
    }

    if (globalPath)
    {
        checkHa(globalPath, false, globalCallback.bind(this));
        fs.watchFile(globalPath, {persistent: true, interval: 1000}, function (current, previous)
    	{
    		if (current.mtime !== previous.mtime)
    		{
        		checkHa(globalPath, false, globalCallback.bind(this));
    		}
    	}.bind(this));
    }
}

/**
 * Gets whether or not the service is active in HAControl.
 *
 * @return {bool} Returns true if the service is active in HAControl.
 */
HAControl.prototype.isActive = function()
{
    return this.localHa
        && this.globalHa;
}

function checkHa(path, writeIfMissing, callback)
{
	fs.readFile(path, function(error, data)
	{
		if (error && writeIfMissing)
		{
			fs.writeFileSync(path, '0', {encoding: null});
			callback(false);
		}
		else
		{
			var newValue = data.toString();
			callback(newValue === '1');
		}
	});
}