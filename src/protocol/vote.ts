import type { Vote, VoteResult, VoteTally, VoteMethod } from '../types.js';

export function tallyVotes(votes: Vote[], options: string[], method: VoteMethod): VoteResult {
  switch (method) {
    case 'simple_majority':
      return simpleMajority(votes, options);
    case 'ranked':
      return rankedChoice(votes, options);
    case 'consensus':
      return consensus(votes, options);
    default:
      throw new Error(`Unknown vote method: ${method}`);
  }
}

function simpleMajority(votes: Vote[], options: string[]): VoteResult {
  const counts = new Map<string, string[]>();
  for (const opt of options) counts.set(opt, []);

  for (const v of votes) {
    const voters = counts.get(v.vote);
    if (voters) voters.push(v.member.name);
  }

  const details: VoteTally[] = options.map((opt) => ({
    option: opt,
    count: counts.get(opt)!.length,
    voters: counts.get(opt)!,
  }));
  details.sort((a, b) => b.count - a.count);

  const isTie = details.length >= 2 && details[0].count === details[1].count;

  return {
    method: 'simple_majority',
    winner: details[0].option,
    details,
    castingVote: isTie,
  };
}

function rankedChoice(votes: Vote[], options: string[]): VoteResult {
  const totalVoters = votes.length;
  const majority = Math.floor(totalVoters / 2) + 1;

  // Build ranking arrays; fallback to single vote if no ranking provided
  let rankings = votes.map((v) => ({
    voter: v.member.name,
    ranking: v.ranking ?? [v.vote],
  }));

  let remaining = [...options];
  const allDetails: VoteTally[] = [];

  while (remaining.length > 1) {
    // Count first-choice votes among remaining options
    const counts = new Map<string, string[]>();
    for (const opt of remaining) counts.set(opt, []);

    for (const r of rankings) {
      const firstChoice = r.ranking.find((opt) => remaining.includes(opt));
      if (firstChoice) {
        counts.get(firstChoice)!.push(r.voter);
      }
    }

    const roundDetails: VoteTally[] = remaining.map((opt) => ({
      option: opt,
      count: counts.get(opt)!.length,
      voters: counts.get(opt)!,
    }));
    roundDetails.sort((a, b) => b.count - a.count);
    allDetails.push(...roundDetails);

    // Check if anyone has majority
    if (roundDetails[0].count >= majority) {
      return {
        method: 'ranked',
        winner: roundDetails[0].option,
        details: roundDetails,
        castingVote: false,
      };
    }

    // Eliminate the option with fewest votes
    const minVotes = roundDetails[roundDetails.length - 1].count;
    const toEliminate = roundDetails.filter((d) => d.count === minVotes);
    remaining = remaining.filter(
      (opt) => !toEliminate.some((d) => d.option === opt),
    );

    if (remaining.length === 0) {
      // All tied - use casting vote
      return {
        method: 'ranked',
        winner: roundDetails[0].option,
        details: roundDetails,
        castingVote: true,
      };
    }
  }

  // Only one option remaining
  const finalDetails: VoteTally[] = [{
    option: remaining[0],
    count: totalVoters,
    voters: rankings.map((r) => r.voter),
  }];

  return {
    method: 'ranked',
    winner: remaining[0],
    details: finalDetails,
    castingVote: false,
  };
}

function consensus(votes: Vote[], options: string[]): VoteResult {
  const counts = new Map<string, string[]>();
  for (const opt of options) counts.set(opt, []);

  for (const v of votes) {
    const voters = counts.get(v.vote);
    if (voters) voters.push(v.member.name);
  }

  const details: VoteTally[] = options.map((opt) => ({
    option: opt,
    count: counts.get(opt)!.length,
    voters: counts.get(opt)!,
  }));
  details.sort((a, b) => b.count - a.count);

  const isUnanimous = details[0].count === votes.length;

  return {
    method: 'consensus',
    winner: details[0].option,
    details,
    castingVote: !isUnanimous, // Speaker decides if no consensus
  };
}
