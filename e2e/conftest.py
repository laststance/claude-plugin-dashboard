"""
pytest + pexpect E2E test configuration for claude-plugin-dashboard CLI.

This module provides fixtures for spawning and controlling the CLI process
in a pseudo-terminal environment.
"""
import os
import pytest
import pexpect


# Project root directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLI_PATH = os.path.join(PROJECT_ROOT, 'dist', 'cli.js')


class Keys:
    """
    Escape sequences for special keys.

    These match the terminal escape sequences that the CLI expects
    for keyboard navigation.
    """
    # Arrow keys
    UP = '\x1b[A'
    DOWN = '\x1b[B'
    RIGHT = '\x1b[C'
    LEFT = '\x1b[D'

    # Ctrl keys (Emacs-style navigation)
    CTRL_N = '\x0e'  # Next (down)
    CTRL_P = '\x10'  # Previous (up)
    CTRL_C = '\x03'  # Interrupt
    CTRL_D = '\x04'  # EOF

    # Other special keys
    TAB = '\t'
    ENTER = '\r'
    ESC = '\x1b'
    SPACE = ' '
    BACKSPACE = '\x7f'

    @staticmethod
    def send_key(child, key, delay=0.3):
        """Send a key and properly flush/wait for processing.

        Args:
            child: pexpect spawn object
            key: Key to send (escape sequence or character)
            delay: Time to wait after sending (default 0.3s)
        """
        import time
        child.send(key)
        child.flush()
        time.sleep(delay)
        # Clear any pending output
        try:
            child.read_nonblocking(size=10000, timeout=0.05)
        except (pexpect.TIMEOUT, pexpect.EOF):
            pass

    @staticmethod
    def quit(child):
        """Robustly quit the application.

        Clears buffers, sends ESC to exit any mode, then 'q' to quit.
        """
        import time
        # Clear any pending output first
        try:
            child.read_nonblocking(size=10000, timeout=0.1)
        except (pexpect.TIMEOUT, pexpect.EOF):
            pass

        time.sleep(0.3)
        # Send ESC to exit any modal/search mode
        child.send('\x1b')
        child.flush()
        time.sleep(0.3)
        # Send 'q' to quit
        child.send('q')
        child.flush()
        time.sleep(0.2)
        child.expect(pexpect.EOF, timeout=5)


@pytest.fixture
def keys():
    """Provide Keys class for test access."""
    return Keys


@pytest.fixture
def cli_path():
    """Return the path to the compiled CLI."""
    return CLI_PATH


@pytest.fixture
def spawn_cli():
    """
    Factory fixture for spawning CLI processes.

    Usage:
        def test_example(spawn_cli):
            child = spawn_cli()  # Interactive mode
            child = spawn_cli('status')  # With command
            child = spawn_cli('list', '--installed')  # With args

    All spawned processes are automatically cleaned up after the test.
    """
    processes = []

    def _spawn(*args, timeout=30, dimensions=(40, 120)):
        """
        Spawn a CLI process with optional arguments.

        Args:
            *args: Command line arguments to pass to the CLI
            timeout: Timeout in seconds for expect operations
            dimensions: Terminal size as (rows, cols)

        Returns:
            pexpect.spawn: The spawned process
        """
        cmd = f'node {CLI_PATH}'
        if args:
            cmd += ' ' + ' '.join(str(a) for a in args)

        child = pexpect.spawn(
            cmd,
            timeout=timeout,
            encoding='utf-8',
            dimensions=dimensions,
            env={**os.environ, 'TERM': 'xterm-256color'}
        )

        # Log output for debugging
        log_path = os.path.join(PROJECT_ROOT, 'e2e', 'test_output.log')
        child.logfile = open(log_path, 'w')

        processes.append(child)
        return child

    yield _spawn

    # Cleanup: terminate all spawned processes
    for p in processes:
        try:
            if p.isalive():
                p.send('\x1b')  # ESC to ensure not in search mode
                p.send('q')    # Try graceful quit
                p.expect([pexpect.EOF, pexpect.TIMEOUT], timeout=2)
        except Exception:
            pass
        finally:
            if p.isalive():
                p.terminate(force=True)


@pytest.fixture
def interactive_cli(spawn_cli):
    """
    Fixture that spawns the CLI in interactive mode and waits for it to be ready.

    Usage:
        def test_example(interactive_cli):
            cli = interactive_cli
            # CLI is already started and showing the dashboard
    """
    child = spawn_cli()
    # Wait for the dashboard to be ready (Discover tab should appear)
    child.expect('Discover', timeout=10)
    return child


def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line(
        "markers", "e2e: End-to-end tests that spawn actual CLI processes"
    )
    config.addinivalue_line(
        "markers", "slow: Tests that may take longer to complete"
    )
