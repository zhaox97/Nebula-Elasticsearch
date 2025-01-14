/**
 * ELASTICSEARCH CONFIDENTIAL
 * _____________________________
 *
 *  [2014] Elasticsearch Incorporated All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Elasticsearch Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Elasticsearch Incorporated
 * and its suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Elasticsearch Incorporated.
 */



define(function (require) {
  var _ = require('lodash');

  var hasPrimaryChildren = require('../lib/hasPrimaryChildren');
  var decorateShards = require('../lib/decorateShards');
  var extractIp = require('../lib/extractIp');

  return function ($scope) {
    return function nodesByIndices(shards, nodes) {

      var getNodeType = function (node) {
        if (node.attributes.client === 'true') {
          return 'client';
        }
        if (node.attributes.data === 'false') {
          return node.attributes.master === 'true' ? 'master' : 'client';
        }
        if (node.attributes.master === 'false') {
          // we know data is true here..
          return 'data';
        }
        return 'normal';
      };

      function createNode(obj, node, id) {
        node.details = extractIp(node);
        node.ip_port = extractIp(node);
        node.type = 'node';
        node.children = [];
        var nodeType = getNodeType(node);
        if (nodeType === 'normal' || nodeType === 'data') {
          obj[id] = node;
        }
        return obj;
      }

      function createIndexAddShard(obj, shard) {
        var node = shard.resolver || 'unassigned';
        var index = shard.index;
        if (!obj[node]) {
          createNode(obj, nodes[node], node);
        }
        var indexObj = _.find(obj[node].children, { id: index });
        if (!indexObj) {
          indexObj = {
            id: index,
            name: index,
            type: 'index',
            children: []
          };
          obj[node].children.push(indexObj);
        }
        indexObj.children.push(shard);
        return obj;
      }

      function isUnassigned(shard) {
        return shard.state === 'UNASSIGNED';
      }

      var data = {};
      if (_.some(shards, isUnassigned)) {
        data.unassigned = {
          name: 'Unassigned',
          master: false,
          type: 'node',
          children: []
        };
      }

      data = _.reduce(decorateShards(shards, nodes), createIndexAddShard, data);

      return _(data).values()
        .sortBy(function (node) {
          return [ node.name !== 'Unassigned', !node.master, node.name ];
        })
        .map(function (node) {
          if (node.name === 'Unassigned') {
            node.unassignedPrimaries = node.children.some(hasPrimaryChildren);
          }
          return node;
        })
        .value();
    };
  };
});
