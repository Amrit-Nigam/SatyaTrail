// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SatyaTrail {
    struct Node {
        string id;
        string url;
        string role;
        uint256 domainReputation;
        uint256 timestamp;
        string title;
    }

    struct GraphData {
        string claim;
        string verdict;
        uint256 accuracyScore;
        Node[] nodes;
        uint256 timestamp;
        address submitter;
    }

    mapping(string => GraphData) public graphs;
    string[] public graphHashes;

    event GraphStored(string indexed hash, string claim, string verdict, uint256 timestamp);

    function storeGraph(
        string memory _hash,
        string memory _claim,
        string memory _verdict,
        uint256 _accuracyScore,
        Node[] memory _nodes
    ) public {
        require(bytes(graphs[_hash].claim).length == 0, "Graph already exists");

        GraphData storage newGraph = graphs[_hash];
        newGraph.claim = _claim;
        newGraph.verdict = _verdict;
        newGraph.accuracyScore = _accuracyScore;
        newGraph.timestamp = block.timestamp;
        newGraph.submitter = msg.sender;

        for (uint i = 0; i < _nodes.length; i++) {
            newGraph.nodes.push(_nodes[i]);
        }

        graphHashes.push(_hash);

        emit GraphStored(_hash, _claim, _verdict, block.timestamp);
    }

    function getGraph(string memory _hash) public view returns (
        string memory claim,
        string memory verdict,
        uint256 accuracyScore,
        uint256 timestamp,
        address submitter,
        Node[] memory nodes
    ) {
        GraphData storage g = graphs[_hash];
        return (g.claim, g.verdict, g.accuracyScore, g.timestamp, g.submitter, g.nodes);
    }
    
    function getGraphCount() public view returns (uint256) {
        return graphHashes.length;
    }
}
