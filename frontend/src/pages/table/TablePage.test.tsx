import { describe, expect, test, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TablePage } from './TablePage';
import { useGameStore } from '../../stores/gameStore';
import { requestPossibleMoves, makeMove, requestNextRound } from '../../features/game/gameEvents';

vi.mock('../../features/game/gameEvents', () => ({
  requestPossibleMoves: vi.fn(),
  requestNextRound: vi.fn(),
  makeMove: vi.fn(),
}));

vi.mock('../../features/socket/useSocketLifecycle', () => ({
  useSocketLifecycle: () => undefined,
}));

vi.mock('../../components/table/PokerTable', () => ({
  PokerTable: ({ snapshot }: { snapshot: { code?: string; stage?: string } }) => (
    <div data-testid="poker-table-stub">
      {snapshot.code}-{snapshot.stage}
    </div>
  ),
}));

describe('TablePage', () => {
  beforeEach(() => {
    useGameStore.setState({
      code: 'AB12',
      stage: 'Pre-Flop',
      pot: 40,
      topBet: 20,
      communityCards: [],
      heroCards: ['Ah', 'Kd'],
      hero: {
        username: 'Ayanami',
        stack: 180,
        cards: ['Ah', 'Kd'],
        status: 'Their Turn',
        currentBet: 20,
        blind: 'BB',
        buyIns: 1,
      },
      currentTurn: 'Ayanami',
      roundInProgress: true,
      players: [],
      possibleMoves: { fold: 'yes', call: 'yes', bet: 60 },
      lastError: '',
      connectionState: 'connected',
    });
    vi.mocked(requestPossibleMoves).mockReset();
    vi.mocked(requestNextRound).mockReset();
    vi.mocked(makeMove).mockReset();
  });

  test('requests possible moves on mount and enables live hero actions', () => {
    render(<TablePage />);

    expect(requestPossibleMoves).toHaveBeenCalledTimes(1);
    expect(screen.getByText('HAND LIVE')).toBeInTheDocument();
    expect(screen.getByText('你行动中')).toBeInTheDocument();

    fireEvent.click(screen.getByText('跟注'));
    fireEvent.click(screen.getByText('弃牌'));
    fireEvent.click(screen.getByText('注入脉冲'));

    expect(makeMove).toHaveBeenNthCalledWith(1, 'call');
    expect(makeMove).toHaveBeenNthCalledWith(2, 'fold');
    expect(makeMove).toHaveBeenNthCalledWith(3, 'bet', 20);
  });

  test('shows next-hand launcher when the table is between hands', () => {
    useGameStore.setState({
      roundInProgress: false,
      currentTurn: '',
      possibleMoves: {},
    });

    render(<TablePage />);

    expect(screen.getByText('TABLE IDLE')).toBeInTheDocument();
    expect(screen.getByText('启动下一手')).toBeInTheDocument();

    fireEvent.click(screen.getByText('启动下一手'));

    expect(requestNextRound).toHaveBeenCalledTimes(1);
  });
});
