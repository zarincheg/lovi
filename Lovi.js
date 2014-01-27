/**
 * @todo Multiple views for same URL bindings
 * @todo QueueLoader and FastLoader
 * @todo data cache
 * @todo Default request(Resource) options for loader instance
 */

var Lovi = Lovi || {};

Lovi.settings = {
	req: {}
}

//@todo Refactor this
Lovi.default = function(o) {
	if(o.req && o.req.options) {
		Lovi.settings.req.options = o.req.options;
	}

	if(o.req && o.req.format) {
		Lovi.settings.req.format = o.req.format;
	}
}

Lovi.Resource = (function(){
	var Resource = function(resource, format) {
		this.options = {};

		if(!resource)
			throw "Expected 1 argument with resource string";

		for(var o in Lovi.settings.req.options) {
			this.options[o] = Lovi.settings.req.options[o];
		}

		this.setOptions({
			resource: resource
		});

		this.format = format || Lovi.settings.req.format || '';
	}

	Resource.prototype = {
		url: function() {
			var url = this.format;

			for(var p in this.options) {
				url = url.replace('%' + p, this.options[p]);
			}

			return url;
		},

		setOptions: function(options) {
			for(var o in options) {
				this.options[o] = options[o];
			}

			return this;
		},

		set: function(name) {
			this.setOptions({
				resource: name
			});

			return this;
		}
	}

	return Resource;
})();

Lovi.Templates = (function() {
	var Templates = function() {
		var items = {};

		$("script[type='text/template']").each(function() {
			items[$(this).attr('data-name')] = $(this).html();
		});

		this.items = items;
	}

	Templates.prototype = {
		get: function(name) {
			if(this.items[name])
				return $(this.items[name]);

			throw "Template with name '"+ name +"' not found";
		},

		list: function() {
			return {
				items: this.items
			}
		}
	}

	return Templates;
})();

Lovi.ViewContainer = (function() {
	var Container = function(items, el) {
		if(!el)
			throw "ViewContainer must have associated DOM Element";

		this.items = items || [];
		this.el = el;

		for (var i = 0; i < this.items.length; i++) {
			this.el.find('section:first').append(this.items[i].el);
		}
	}

	Container.prototype = {
		get: function(id) {
			return this.items[id];
		},

		hide: function() {
			for (var i = 0; i < this.items.length; i++) {
				this.items[i].hide();
			}
		},

		show: function() {
			this.el.show();

			for (var i = 0; i < this.items.length; i++) {
				this.items[i].show();
			}
		},

		clear: function() {
			this.el.empty();
		},

		add: function(item) {
			if(!(item instanceof Lovi.View) && !(item instanceof Lovi.ViewContainer))
				throw "Unsupported type of item";

			this.items.push(item);
			this.el.find('section:first').append(item.el);
		}
	}

	return Container;
})();

Lovi.View = (function() {
	var View = function(el, o) {
		if(!el) throw "DOM element expected";

		this.el = el;

		for(var m in o) {
			if(m in View.prototype) {
				this[m] = o[m];
			} else {
				throw "Can't override a non-existent method";
			}
		}
	}

	View.prototype = {
		view: function() {
			console.log('View!');
		},

		wait: function() {
			console.log('Wait!');
		},

		update: function(data) {
			console.log('Update!');
		},

		hide: function() {
			this.el.hide();
		},

		show: function() {
			this.el.show();
		},

		append: function() {
			// Чтобы пихать его куда нам надо, тут просто меняем this.el
		}
	}

	return View;
})();

Lovi.ViewRegistry = (function() {
	var Registry = function(object) {
		this.views = object || {};

		for(var name in object) {
			this.add(name, object[name]);
		}
	}

	Registry.prototype = {
		get: function(name) {
			if(this.views[name])
				return this.views[name];

			return null;
		},

		add: function(name, view) {
			if(!(view instanceof Lovi.View))
				throw "First argument must be instance of Lovi.View";

			this.views[name] = view;
		}
	}

	return Registry;
})();

Lovi.CompleteLoader = (function() {
	var Loader = function() {
		this.map = [];
	}

	Loader.prototype = {
		bind: function() {
			if(!arguments.length) throw "Nothing to bind. URL and related View object expected.";

			var args = [].slice.call(arguments);
			var bindList = [];

			if((args[0] instanceof Lovi.Resource) && (args[1] instanceof Lovi.View)) {
				bindList.push([args[0], args[1]]);
			} else if(args[0] instanceof Array) {
				bindList = args;
			}

			for(var i = 0; i < bindList.length; i++) {
				if(bindList[i].length != 2 || !(bindList[i][1] instanceof Lovi.View) || !(bindList[i][0] instanceof Lovi.Resource)) {
					continue;
				}

				this.map.push({
					view: bindList[i][1],
					resource: bindList[i][0]
				});
			}

			if(!this.map.length) throw "Relations map is empty. Incorrect bind parameters."
		},

		load: function() {
			var resources = $.map(this.map, function(item) {
				return $.get(item.resource.url());
			});
			var map = this.map;

			/**
			 * @todo Убрать этот костыль. Сделать еще один лоадер - "всё или ничего". Так раньше работал этот. А тут разрулить ситуацию более аккуратно.
			 */
			$.when.apply($, resources).always(function() {
				$.each(resources, function() {
					this.done(function() {
						for (var i = 0; i < map.length; i++) { // @todo Вот этот костыль!
							if (this.url === map[i].resource.url()) {
								map[i].view.update(arguments[0]);
							}
						}
					});
				});
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
