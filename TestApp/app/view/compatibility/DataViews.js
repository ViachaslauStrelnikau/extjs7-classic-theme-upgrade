Ext.define('TestApp.view.compatibility.DataViews', {
    extend: 'Ext.panel.Panel',
    xtype: 'compatibility-data-views',

    requires: [
        'Ext.grid.Panel',
        'Ext.grid.plugin.CellEditing',
        'Ext.tree.Panel',
        'TestApp.view.compatibility.FixtureData'
    ],

    initComponent: function () {
        this.items[0].store.data = TestApp.view.compatibility.FixtureData.rows;
        this.items[1].store.root = TestApp.view.compatibility.FixtureData.treeRoot;
        this.callParent(arguments);
    },

    title: 'Grids and trees',
    cls: 'compatibility-data-views',
    bodyPadding: 8,
    layout: {
        type: 'hbox',
        align: 'stretch'
    },

    items: [{
        xtype: 'grid',
        itemId: 'compatibility-grid',
        title: 'Compatibility grid',
        flex: 1,
        minWidth: 420,
        margin: '0 8 0 0',
        height: 360,
        scrollable: true,
        store: {
            fields: ['id', 'name', 'email', 'status']
        },
        selModel: {
            selType: 'rowmodel',
            mode: 'SINGLE'
        },
        columns: [{
            text: 'ID',
            dataIndex: 'id',
            width: 90
        }, {
            text: 'Name',
            dataIndex: 'name',
            width: 180,
            sortable: true,
            editor: {
                xtype: 'textfield',
                allowBlank: false
            }
        }, {
            text: 'Email address',
            dataIndex: 'email',
            width: 250,
            sortable: true,
            editor: {
                xtype: 'textfield',
                allowBlank: false
            }
        }, {
            text: 'Status',
            dataIndex: 'status',
            width: 140,
            sortable: true
        }, {
            text: 'Status detail',
            dataIndex: 'status',
            width: 180
        }, {
            text: 'Name reference',
            dataIndex: 'name',
            width: 220
        }],
        plugins: [{
            ptype: 'cellediting',
            clicksToEdit: 1
        }]
    }, {
        xtype: 'treepanel',
        itemId: 'compatibility-tree',
        title: 'Compatibility tree',
        width: 260,
        height: 360,
        rootVisible: false,
        useArrows: true,
        store: {
            root: {}
        },
        columns: [{
            xtype: 'treecolumn',
            text: 'Name',
            dataIndex: 'text',
            flex: 1
        }]
    }]
});
