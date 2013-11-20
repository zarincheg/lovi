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
		bind: function(url, block) {
			if(!url || !block) throw "Two arguments expected";
			if(!(block instanceof Lovi.Block)) throw "Second argument must be a Block object";

			this.map.push({
				block: block,
				url: url
			});
		},

		load: function() {
			var resources = $.map(this.map, function(item) {
				return $.get(item.url);
			});

			$.when.apply($, resources).done(function() {
				for(var i = 0; i < arguments.length; i++) {
					Loader.map[i].block.update(arguments[i][0]);
				}
			});
		}
	}

	return Loader;
})();
