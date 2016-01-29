Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {

        console.log('My first app in Rally');
        this._loadData();
    },

    _loadData: function() {

    	var myStore = Ext.create('Rally.data.wsapi.Store', {
    		model: 'Portfolio Item/Initiative',
    		autoLoad: true,
    		listeners: {
     			load: function(myStore, myData, success) {
     		    	console.log('get data', myStore, myData, success);
     		    	this._loadGrid(myStore);
     			},
    			scope: this
   	 		},
   	 		fetch: ['formattedID', 'Name']
		});    
    },

    _loadGrid: function(myPIStore) {
    	var myGrid = Ext.create('Rally.ui.grid.Grid', {
     		store: myPIStore,
     		columnCfgs: [
     			'FormattedID', 'Name'
        	]
     	});

		this.add(myGrid);
		console.log('what is this?', this);
    }
});
