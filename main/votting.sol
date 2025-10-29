// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Election
 * @dev Smart contract for managing a transparent and secure election process
 * @notice This contract handles voter registration, candidate management, and voting
 */
contract Election {

    
    enum Phase { RegistrationPhase, VotingPhase, EndPhase } //chia giai đoạn  của một cuộc bầu cử
    Phase public currentPhase; // biểu thị cho giai đoạn hiện tại

    struct Voter {
        bool isRegistered;   // Đã đăng ký chưa
        bool isVerified;     // Đã được admin xác minh chưa
        bool hasVoted;       // Đã bỏ phiếu chưa
        uint256 votedCandidateId;  // Bỏ phiếu cho ứng cử viên nào
    }

    struct Candidate {
        uint256 id;          // ID duy nhất
        string name;         // Tên ứng cử viên
        string party;        // Đảng phái
        address candidateAddress;  // Địa chỉ ứng cử viên (nếu cần)
        uint256 voteCount;   // Số phiếu bầu
    }

    address public owner;
    mapping(address => Voter) public voters; // lưu thông tin cử tri theo địa chỉ
    Candidate[] public candidates; // danh sách ứng viên
    
    
    address[] private registeredVotersList; // danh sách những người đăng kí bầu cử
    
    uint256 public voterCount; // số lượng phiếu bầu
    uint256 public candidateCount; // số lượng ứng cử viên
    uint256 private _nextCandidateId;  // Counter cho candidate ID
    // Envent
    event VoterRegistered(address indexed voter, uint256 voterCount);
    event VoterVerified(address indexed voter);
    event CandidateAdded(uint256 indexed candidateId, string name, string party, address candidateAddress);
    event Voted(address indexed voter, uint256 candidateId);
    event PhaseChanged(Phase newPhase);
    event VotesReset();
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier inPhase(Phase _phase) {
        require(currentPhase == _phase, "Not in required phase");
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor() {
        owner = msg.sender; 
        currentPhase = Phase.RegistrationPhase;
        _nextCandidateId = 1; // Bắt đầu từ 1 để tránh confusion với 0
        emit OwnershipTransferred(address(0), owner);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    /**
     * @notice Chuyển quyền sở hữu contract
     * @param _newOwner Địa chỉ owner mới
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner is zero address");
        require(_newOwner != owner, "Already owner");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    /**
     * @notice Thêm ứng cử viên mới
     * @param _name Tên ứng cử viên
     * @param _party Đảng phái
     * @param _candidateAddress Địa chỉ ứng cử viên (optional, có thể để address(0))
     */
    function addCandidate(
        string memory _name, 
        string memory _party, 
        address _candidateAddress
    ) external onlyOwner inPhase(Phase.RegistrationPhase) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_party).length > 0, "Party cannot be empty");
        
        // Tạo candidate mới với ID tăng dần
        candidates.push(Candidate({
            id: _nextCandidateId,
            name: _name,
            party: _party,
            candidateAddress: _candidateAddress,
            voteCount: 0
        }));
        
        candidateCount++;
        emit CandidateAdded(_nextCandidateId, _name, _party, _candidateAddress);
        _nextCandidateId++;
    }

    /**
     * @notice Xác minh cử tri đã đăng ký
     * @param _voter Địa chỉ cử tri cần xác minh
     */
    function verifyVoter(address _voter) external onlyOwner inPhase(Phase.RegistrationPhase) {
        Voter storage voter = voters[_voter];
        require(voter.isRegistered, "Voter not registered");
        require(!voter.isVerified, "Already verified");
        
        voter.isVerified = true;
        emit VoterVerified(_voter);
    }

    /**
     * @notice Xác minh nhiều cử tri cùng lúc (tiết kiệm gas)
     * @param _voters Mảng địa chỉ cử tri
     */
    function verifyVotersBatch(address[] calldata _voters) external onlyOwner inPhase(Phase.RegistrationPhase) {
        for (uint256 i = 0; i < _voters.length; i++) {
            Voter storage voter = voters[_voters[i]];
            if (voter.isRegistered && !voter.isVerified) {
                voter.isVerified = true;
                emit VoterVerified(_voters[i]);
            }
        }
    }

    /**
     * @notice Chuyển phase bầu cử
     * @param _newPhase Phase mới
     */
    function setPhase(Phase _newPhase) external onlyOwner {
        require(
            (_newPhase == Phase.VotingPhase && currentPhase == Phase.RegistrationPhase) ||
            (_newPhase == Phase.EndPhase && currentPhase == Phase.VotingPhase) ||
            (_newPhase == Phase.RegistrationPhase && currentPhase == Phase.EndPhase), // Cho phép reset
            "Invalid phase transition"
        );
        
        currentPhase = _newPhase;
        emit PhaseChanged(_newPhase);
    }

    /**
     * @notice Reset tất cả votes (emergency only)
     * @dev Chỉ được gọi khi KHÔNG trong giai đoạn voting
     */
    function emergencyResetVotes() external onlyOwner {
        require(currentPhase != Phase.VotingPhase, "Cannot reset during voting");
        
        // Reset vote count của tất cả candidates
        for (uint256 i = 0; i < candidateCount; i++) {
            candidates[i].voteCount = 0;
        }
        
        // Reset voter state
        for (uint256 i = 0; i < registeredVotersList.length; i++) {
            Voter storage voter = voters[registeredVotersList[i]];
            voter.hasVoted = false;
            voter.votedCandidateId = 0;
        }
        
        emit VotesReset();
    }

    /**
     * @notice Xóa toàn bộ dữ liệu để bắt đầu cuộc bầu cử mới
     * @dev Cực kỳ nguy hiểm - chỉ dùng khi cần thiết
     */
    function emergencyFullReset() external onlyOwner {
        require(currentPhase == Phase.EndPhase, "Must be in end phase");
        
        // Reset candidates
        delete candidates;
        candidateCount = 0;
        _nextCandidateId = 1;
        
        // Reset voters
        for (uint256 i = 0; i < registeredVotersList.length; i++) {
            delete voters[registeredVotersList[i]];
        }
        delete registeredVotersList;
        voterCount = 0;
        
        // Reset phase
        currentPhase = Phase.RegistrationPhase;
        
        emit VotesReset();
        emit PhaseChanged(Phase.RegistrationPhase);
    }

    // ============================================
    // PUBLIC FUNCTIONS
    // ============================================
    
    /**
     * @notice Đăng ký làm cử tri
     * @dev Chỉ được gọi trong RegistrationPhase
     */
    function registerVoter() external inPhase(Phase.RegistrationPhase) {
        Voter storage voter = voters[msg.sender];
        require(!voter.isRegistered, "Already registered");
        
        voter.isRegistered = true;
        voter.isVerified = false;
        voter.hasVoted = false;
        voter.votedCandidateId = 0;
        
        registeredVotersList.push(msg.sender);
        voterCount++;
        
        emit VoterRegistered(msg.sender, voterCount);
    }

    /**
     * @notice Bỏ phiếu cho ứng cử viên
     * @param _candidateId ID của ứng cử viên (không phải index!)
     */
    function vote(uint256 _candidateId) external inPhase(Phase.VotingPhase) {
        Voter storage voter = voters[msg.sender];
        require(voter.isRegistered, "Voter not registered");
        require(voter.isVerified, "Voter not verified");
        require(!voter.hasVoted, "Already voted");
        
        // Tìm candidate theo ID (không phải index)
        bool found = false;
        uint256 candidateIndex;
        
        for (uint256 i = 0; i < candidateCount; i++) {
            if (candidates[i].id == _candidateId) {
                found = true;
                candidateIndex = i;
                break;
            }
        }
        
        require(found, "Invalid candidate ID");
        
        // Ghi nhận vote
        candidates[candidateIndex].voteCount++;
        voter.hasVoted = true;
        voter.votedCandidateId = _candidateId;
        
        emit Voted(msg.sender, _candidateId);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /**
     * @notice Lấy thông tin cử tri
     * @param _voter Địa chỉ cử tri
     */
    function getVoter(address _voter) external view returns (Voter memory) {
        return voters[_voter];
    }

    /**
     * @notice Lấy thông tin ứng cử viên theo index
     * @param _index Index trong array candidates
     */
    function getCandidateByIndex(uint256 _index) external view returns (Candidate memory) {
        require(_index < candidateCount, "Invalid candidate index");
        return candidates[_index];
    }

    /**
     * @notice Lấy thông tin ứng cử viên theo ID
     * @param _candidateId ID của ứng cử viên
     */
    function getCandidateById(uint256 _candidateId) external view returns (Candidate memory) {
        for (uint256 i = 0; i < candidateCount; i++) {
            if (candidates[i].id == _candidateId) {
                return candidates[i];
            }
        }
        revert("Candidate not found");
    }

    /**
     * @notice Lấy tất cả ứng cử viên
     */
    function getAllCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    /**
     * @notice Lấy kết quả bầu cử (tất cả candidates với vote count)
     */
    function getResults() external view returns (Candidate[] memory) {
        require(currentPhase == Phase.EndPhase, "Election not ended");
        return candidates;
    }

    /**
     * @notice Tìm người chiến thắng
     */
    function getWinner() external view returns (Candidate memory winner) {
        require(currentPhase == Phase.EndPhase, "Election not ended");
        require(candidateCount > 0, "No candidates");
        
        uint256 maxVotes = 0;
        uint256 winnerIndex = 0;
        
        for (uint256 i = 0; i < candidateCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerIndex = i;
            }
        }
        
        return candidates[winnerIndex];
    }

    /**
     * @notice Kiểm tra xem có tie (hòa) không
     */
    function hasTie() external view returns (bool) {
        require(currentPhase == Phase.EndPhase, "Election not ended");
        require(candidateCount > 1, "Need at least 2 candidates");
        
        uint256 maxVotes = 0;
        uint256 countWithMaxVotes = 0;
        
        // Tìm số phiếu cao nhất
        for (uint256 i = 0; i < candidateCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                countWithMaxVotes = 1;
            } else if (candidates[i].voteCount == maxVotes) {
                countWithMaxVotes++;
            }
        }
        
        return countWithMaxVotes > 1;
    }

    /**
     * @notice Lấy số lượng cử tri đã bỏ phiếu
     */
    function getVotedCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < registeredVotersList.length; i++) {
            if (voters[registeredVotersList[i]].hasVoted) {
                count++;
            }
        }
        return count;
    }

    /**
     * @notice Lấy tỷ lệ cử tri đi bỏ phiếu (percentage * 100)
     * @dev Trả về số nguyên, ví dụ: 7523 = 75.23%
     */
    function getTurnoutPercentage() external view returns (uint256) {
        if (voterCount == 0) return 0;
        
        uint256 votedCount = 0;
        for (uint256 i = 0; i < registeredVotersList.length; i++) {
            if (voters[registeredVotersList[i]].hasVoted) {
                votedCount++;
            }
        }
        
        return (votedCount * 10000) / voterCount; // x100 để có 2 chữ số thập phân
    }

    /**
     * @notice Lấy danh sách tất cả cử tri đã đăng ký
     */
    function getRegisteredVoters() external view returns (address[] memory) {
        return registeredVotersList;
    }

    /**
     * @notice Lấy số lượng cử tri đã verified
     */
    function getVerifiedVoterCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < registeredVotersList.length; i++) {
            if (voters[registeredVotersList[i]].isVerified) {
                count++;
            }
        }
        return count;
    }
}