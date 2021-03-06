Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        this.pulldownContainer = Ext.create('Ext.container.Container', {
            layout: {
                type: 'hbox',
                align: 'stretch'
            }
        });

        this.add(this.pulldownContainer);

        this._getPortfolioType();
        this._setStartDate();
        this._setEndDate();
    },

    _getPortfolioType: function() {

        var piTypeField = Ext.create('Ext.Container', {
            items: [{
                xtype: 'rallyportfolioitemtypecombobox',
                fieldLabel: 'Item Type',
                listeners: {
                    change: function(x, newvalue, oldvalue, object) {
                        this.piType = x.getRecord().get('Name');
                        this._loadData();
                        },
                    scope: this    
                    }
                }],
            renderTo: Ext.getBody().dom
        });
        this.pulldownContainer.add(piTypeField);
    },

    _setStartDate: function() {
        this.startDate = Ext.Date.add(new Date(), Ext.Date.DAY, -7);

        var startDateField = Ext.create('Ext.Container', {
            items: [{
                xtype: 'rallydatefield',
                fieldLabel: 'Start Date',
                listeners: {
                    change: function(x, newvalue, oldvalue, object) {
                        this.startdate = newvalue;
                        this._loadData();
                        },
                    scope: this
                    },    
                maxValue: Ext.Date.add(new Date(), Ext.Date.DAY, -1),
                value: this.startDate
                }],
            renderTo: Ext.getBody().dom
        });

        this.pulldownContainer.add(startDateField);
    },

    _setEndDate: function() {
        this.endDate = Ext.Date.add(new Date());

        var endDateField = Ext.create('Ext.Container', {
            items: [{
                xtype: 'rallydatefield',
                fieldLabel: 'End Date',
                listeners: {
                    change: function(x, newvalue, oldvalue, object) {
                        this.endDate = newvalue;
                        this._loadData();
                        },
                    scope: this
                    },    
                maxValue: Ext.Date.add(new Date()),
                value: this.endDate
                }],
            renderTo: Ext.getBody().dom
        });

        this.pulldownContainer.add(endDateField);
    },

    _loadData: function() {
        var myFilters = [
            {
                property: 'PortfolioItemType.Name',
                operator: '=',
                value: this.piType
            }
        ];    

        if(this.itemStore) {
            this.itemStore.setFilter(myFilters);
            this.itemStore.load();
        } else {
            this.itemStore = Ext.create('Rally.data.wsapi.Store', {
                model: 'Portfolio Item',
                autoLoad: true,
                filters: myFilters,
                listeners: {
                    load: function(myStore, myData, success) {
                        this._processPortfolioItems();
//                        this._createPointsGrid();
                        this._drawPieChart();
                    },
                    scope: this    
                },
                fetch: ['FormattedID','ObjectID', 'Name', 'PortfolioItemType']
            });
        }      
    },

    _processPortfolioItems: function() {

        this._createArrayStore();

        this.itemStore.each(function(record) {
            var item = record.get('ObjectID');
            var id = record.get('FormattedID');
            var name = record.get('Name');

            this._getPointsDifference(item,this.startDate).then({
                scope: this,
                success: function(startPoints) {
                    this._getPointsDifference(item,this.endDate).then({
                        scope: this,
                        success: function(endPoints) {
                            var totalPoints = endPoints - startPoints;
//                            console.log(id, name, totalPoints);
                            this.newPointsStore.add({
                                FormattedID:id, 
                                Name:name, 
                                Start: startPoints, 
                                End: endPoints, 
                                Points:totalPoints});
                        },
                        failure: function(error) {
//                            console.log("Error 2");
                        }
                    });
                },
                failure: function(error) {
//                    console.log("Error");
                }    
            });            
        },this);

//        this._createPointsGrid();
    },

    _getPointsDifference: function(objid, uDate) {
        var deferred = Ext.create('Deft.Deferred');

        var uStore = Ext.create('Rally.data.lookback.SnapshotStore', {
            autoLoad: true,
            listeners: {
                scope: this,
                load: function(uStore, uData, success) {
                    uStore.each(function(record) {
                        var points = record.get('AcceptedLeafStoryPlanEstimateTotal'); 
                        deferred.resolve(points);
                    },this);
                }
            },
            fetch: ['Name', 'AcceptedLeafStoryPlanEstimateTotal'],
            filters: [
                {
                    property: 'ObjectID',
                    operator: '=',
                    value: objid
                },
                {
                    property: '__At',
                    value: uDate
                }
            ]
        });

        return deferred.promise;
    },

    _createArrayStore: function() {

        if (this.newPointsStore) {
            this.newPointsStore.removeAll();
        } else {
            this.newPointsStore = new Ext.data.ArrayStore({
                fields: [
                    'FormattedID',
                    'Name',
                    'Start',
                    'End',
                    'Points'
                ]
            });
        }    
    },

    _createPointsGrid: function() {

        if(!this.pointsGrid) {
            this.pointsGrid = new Ext.grid.Panel({
                store: this.newPointsStore,
                columns: [
                    {text: 'ID',        dataIndex: 'FormattedID'},       
                    {text: 'Name',      dataIndex: 'Name',   flex:1},
                    {text: 'Start',     dataIndex: 'Start'},
                    {text: 'End',       dataIndex: 'End'},
                    {text: 'Points',    dataIndex: 'Points'}
                ],
//                title: 'Portfolio Items - Points Completed',
                renderTo: Ext.getBody()
                });
            this.add(this.pointsGrid);
        }
    },

    _drawPieChart: function() {

        if(!this.pieChart) {
            this.pieChart = new Ext.chart.Chart({
                width: 400,
                height: 300,
                animate: true,
//                autoSize: true,
//                autoScroll: true,
                store: this.newPointsStore,
                renderTo: Ext.getBody(),
                shadow: true,
                legend: {
                    position: 'right'
                },
                insetPadding: 25,
                theme: 'Base:gradients',
                series: [{
                    type: 'pie',
                    field: 'Points',
                    showInLegend: true,
                    tips: {
                        trackMouse: true,
                        width: 300,
                        height: 28,
                        renderer: function(storeItem, item) {
                            this.setTitle(storeItem.get('Name') + ': ' + storeItem.get('Points'));
                        }
                    },
                    highlight: {
                        segment: {
                            margin: 20
                        }
                    },
                    label: {
                        field: 'Name',
                        display: 'none'
                    },
                    animate: true
                }]
            });
            this.add(this.pieChart);
        }    
    }    
});
