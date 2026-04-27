import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RoomPage } from './RoomPage';
import { useRoomStore, defaultSettings } from '../../stores/roomStore';
import { useGameStore } from '../../stores/gameStore';

const startGame = vi.fn();
const navigateSpy = vi.fn();

vi.mock('../../features/room/roomApi', () => ({
  startGame: (...args: unknown[]) => startGame(...args),
}));

vi.mock('../../features/socket/useSocketLifecycle', () => ({
  useSocketLifecycle: () => undefined,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  };
});

describe('RoomPage', () => {
  beforeEach(() => {
    startGame.mockReset();
    navigateSpy.mockReset();
    useRoomStore.setState({
      code: 'ABCD',
      host: 'host',
      players: ['host', 'guest'],
      playerCount: 2,
      canStart: true,
      settings: defaultSettings,
    });
    useGameStore.setState({
      lastError: '',
      hero: { username: 'host', stack: 100, cards: [], status: 'active', blind: '', currentBet: 0, buyIns: 1 },
      roundInProgress: false,
      code: '',
    });
  });

  test('does not navigate to table until the game actually starts', async () => {
    render(
      <MemoryRouter>
        <RoomPage />
      </MemoryRouter>
    );

    screen.getByText('发牌').click();

    expect(startGame).toHaveBeenCalledWith('ABCD');
    expect(navigateSpy).not.toHaveBeenCalled();

    useGameStore.setState({
      roundInProgress: true,
      stage: 'Pre-Flop',
      currentTurn: 'host',
      hero: { username: 'host', stack: 100, cards: ['Ah', 'Kd'], status: 'active', blind: 'SB', currentBet: 1, buyIns: 1 },
      players: [],
      pot: 3,
      topBet: 2,
      communityCards: [],
      code: 'ABCD',
    });

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith('/table');
    });
  });

  test('shows start control only for the host when enough players are seated', () => {
    useRoomStore.setState({
      code: 'ABCD',
      host: 'other-host',
      players: ['other-host', 'guest'],
      playerCount: 2,
      canStart: true,
    });
    useGameStore.setState({
      hero: { username: 'guest', stack: 100, cards: [], status: 'active', blind: '', currentBet: 0, buyIns: 1 },
    });

    render(
      <MemoryRouter>
        <RoomPage />
      </MemoryRouter>
    );

    expect(screen.queryByText('发牌')).not.toBeInTheDocument();
    expect(screen.getByText('等待房主开局')).toBeInTheDocument();
  });
});
