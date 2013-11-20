var Views = new ViewContainer({
	'first': new Block($('#first-div'), {
		update: function(data) {
			this.el.text(data);
		}
	}),
	'second': new Block($('#second-div'), {
		update: function(data) {
			this.el.text(data);
		}
	})
});

Lovi.default({
	req: {
		options: {
			anyoption: 'default'
		},
		format: 'https://localhost/%anyoption/%resource'
	}
});

var loader = new Lovi.CompleteLoader();
var req = new Lovi.Req();

loader.bind(req.url('data/for/first'), Views.block('first'));
loader.bind(req.url('data/for/second'), Views.block('second'));

loader.load();

/*
  It's send two ajax requests:
  1. https://localhost/default/data/for/first
  2. https://localhost/default/data/for/second
  
  And then, after all of requests completed, will display results in blocks with ids #first-div and #second-div
*/
