/**
 * @todo Binding maps - it is presets for loading from bunch of URLs and for multiple usage by simple way
 * @todo Multiple blocks for same URL bindings
 * @todo QueueLoader and FastLoader
 * @todo data cache
 * @todo Default request(Req) options for loader instance
 */

var Lovi = Lovi || {};

Lovi.settings = {
	req: {}
}

Lovi.default = function(o) {
	if(o.req && o.req.options) {
		Lovi.settings.req.options = o.req.options;
	}

	if(o.req && o.req.format) {
		Lovi.settings.req.format = o.req.format;
	}
}

Lovi.Req = (function(){
	var Req = function(options, format) {
		this.options = {};
		options = options || {};

		for(var o in Lovi.settings.req.options) {
			this.options[o] = Lovi.settings.req.options[o];
		}

		for(var o in options) {
			this.options[o] = options[o];
		}

		this.format = format || Lovi.settings.req.format || '';
	}

	Req.prototype = {
		url: function(resource) {
			var url = this.format;

			if(resource) this.options.resource = resource;

			for(var p in this.options) {
				url = url.replace('%' + p, this.options[p]);
			}

			return url;
		},

		res: function(resource) {
			this.setOptions({
				resource: resource
			});

			return new Lovi.Req(this.options);
		},

		setOptions: function(options) {
			for(var o in options) {
				this.options[o] = options[o];
			}
		}
	}

	return Req;
})();

Lovi.ViewContainer = (function() {
	var Container = function(blocks) {
		this.blocks = blocks;
	}

	Container.prototype = {
		block: function(id) {
			return this.blocks[id];
		}
	}

	return Container;
})();

Lovi.Block = (function() {
	var Block = function(el, o) {
		if(!el) throw "DOM element expected";

		this.el = el;

		for(var m in o) {
			if(m in Block.prototype) {
				this[m] = o[m];
			} else {
				throw "Can't override a non-existent method";
			}
		}
	}

	Block.prototype = {
		view: function() {
			console.log('View!');
		},

		wait: function() {
			console.log('Wait!');
		},

		update: function(data) {
			console.log('Update!');
		}
	}

	return Block;
})();

Lovi.CompleteLoader = (function() {
	var Loader = function() {
		this.map = [];
	}

	Loader.prototype = {
		bind: function() {
			if(!arguments.length) throw "Nothing to bind. URL and related Block object expected.";

			var args = [].slice.call(arguments);
			var bindList = [];

			if((args[0] instanceof Lovi.Req) && (args[1] instanceof Lovi.Block)) {
				bindList.push([args[0], args[1]]);
			} else if(args[0] instanceof Array) {
				bindList = args;
			}

			for(var i = 0; i < bindList.length; i++) {
				if(bindList[i].length != 2 || !(bindList[i][1] instanceof Lovi.Block) || !(bindList[i][0] instanceof Lovi.Req)) {
					continue;
				}

				this.map.push({
					block: bindList[i][1],
					req: bindList[i][0]
				});
			}

			if(!this.map.length) throw "Relations map is empty. Incorrect bind parameters."
		},

		load: function() {
			var resources = $.map(this.map, function(item) {
				return $.get(item.req.url());
			});
			var map = this.map;

			$.when.apply($, resources).done(function() {
				if(arguments[0] instanceof Array) {
					for(var i = 0; i < arguments.length; i++) {
						map[i].block.update(arguments[i][0]);
					}
				} else {
					map[0].block.update(arguments[0]);
				}
			});
		},

		each: function(callback) {
			this.map.forEach(function(v, i, a) {
				a[i] = callback(v);
			});

			return this;
		}
	}

	return Loader;
})();
