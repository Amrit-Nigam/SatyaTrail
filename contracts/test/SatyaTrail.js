const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("SatyaTrail", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploySatyaTrailFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const SatyaTrail = await ethers.getContractFactory("SatyaTrail");
    const satyaTrail = await SatyaTrail.deploy();

    return { satyaTrail, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should start with 0 graphs", async function () {
      const { satyaTrail } = await loadFixture(deploySatyaTrailFixture);
      expect(await satyaTrail.getGraphCount()).to.equal(0);
    });
  });

  describe("Graph Storage", function () {
    it("Should store a new graph correctly", async function () {
      const { satyaTrail, owner } = await loadFixture(deploySatyaTrailFixture);

      const hash = "QmHash123";
      const claim = "This is a test claim";
      const verdict = "True";
      const accuracyScore = 95;
      const nodes = [
        {
          id: "node1",
          url: "http://example.com",
          role: "source",
          domainReputation: 80,
          timestamp: Date.now(),
          title: "Example Source"
        }
      ];

      await expect(satyaTrail.storeGraph(hash, claim, verdict, accuracyScore, nodes))
        .to.emit(satyaTrail, "GraphStored")
        .withArgs(hash, claim, verdict, anyValue); // timestamp is dynamic

      const count = await satyaTrail.getGraphCount();
      expect(count).to.equal(1);
    });

    it("Should retrieve a stored graph correctly", async function () {
      const { satyaTrail, owner } = await loadFixture(deploySatyaTrailFixture);

      const hash = "QmHash123";
      const claim = "This is a test claim";
      const verdict = "True";
      const accuracyScore = 95;
      const nodes = [
        {
          id: "node1",
          url: "http://example.com",
          role: "source",
          domainReputation: 80,
          timestamp: 1234567890,
          title: "Example Source"
        }
      ];

      await satyaTrail.storeGraph(hash, claim, verdict, accuracyScore, nodes);

      const graph = await satyaTrail.getGraph(hash);

      expect(graph.claim).to.equal(claim);
      expect(graph.verdict).to.equal(verdict);
      expect(graph.accuracyScore).to.equal(accuracyScore);
      expect(graph.submitter).to.equal(owner.address);
      expect(graph.nodes.length).to.equal(1);
      expect(graph.nodes[0].id).to.equal(nodes[0].id);
    });

    it("Should fail if graph already exists", async function () {
      const { satyaTrail } = await loadFixture(deploySatyaTrailFixture);

      const hash = "QmHash123";
      const claim = "This is a test claim";
      const verdict = "True";
      const accuracyScore = 95;
      const nodes = [];

      await satyaTrail.storeGraph(hash, claim, verdict, accuracyScore, nodes);

      await expect(
        satyaTrail.storeGraph(hash, "Another claim", "False", 10, nodes)
      ).to.be.revertedWith("Graph already exists");
    });
  });
});
