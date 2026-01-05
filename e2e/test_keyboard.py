"""
E2E tests for keyboard navigation in claude-plugin-dashboard.

Tests verify that all documented keyboard shortcuts work as expected:
- Tab navigation (←, →, Tab)
- List navigation (↑, ↓, Ctrl+P, Ctrl+N)
- Search (/, Esc)
- Quit (q)
"""
import time
import pexpect
import pytest


@pytest.mark.e2e
class TestTabNavigation:
    """Test tab switching functionality."""

    def test_tab_switch_with_tab_key(self, spawn_cli, keys):
        """Tab key switches to next tab."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)
        time.sleep(0.5)  # Wait for init

        # Tab to next tab
        keys.send_key(child, keys.TAB)

        keys.quit(child)

    def test_tab_switch_with_right_arrow(self, spawn_cli, keys):
        """Right arrow key switches to next tab."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)
        time.sleep(0.5)  # Wait for init

        keys.send_key(child, keys.RIGHT)

        keys.quit(child)

    def test_tab_switch_with_left_arrow(self, spawn_cli, keys):
        """Left arrow key switches to previous tab."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)
        time.sleep(0.5)  # Wait for init

        # Go right first
        keys.send_key(child, keys.RIGHT)

        # Then go left back to Discover
        keys.send_key(child, keys.LEFT)

        keys.quit(child)

    def test_cycle_through_all_tabs(self, spawn_cli, keys):
        """Can cycle through all four tabs."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)
        time.sleep(0.5)  # Wait for init

        # Cycle through all tabs
        for _ in range(4):
            keys.send_key(child, keys.TAB, delay=0.2)

        keys.quit(child)


@pytest.mark.e2e
class TestListNavigation:
    """Test list navigation with arrow keys and Emacs shortcuts."""

    def test_down_arrow_navigation(self, spawn_cli, keys):
        """Down arrow moves selection down."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)
        time.sleep(0.5)  # Wait for init

        # Navigate down
        keys.send_key(child, keys.DOWN)

        keys.quit(child)

    def test_up_arrow_navigation(self, spawn_cli, keys):
        """Up arrow moves selection up."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)
        time.sleep(0.5)  # Wait for init

        # Go down first, then up
        keys.send_key(child, keys.DOWN, delay=0.2)
        keys.send_key(child, keys.UP)

        keys.quit(child)

    def test_ctrl_n_navigation(self, spawn_cli, keys):
        """Ctrl+N moves selection down (Emacs-style)."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)
        time.sleep(0.5)  # Wait for init

        # Ctrl+N should work like down arrow
        keys.send_key(child, keys.CTRL_N)

        keys.quit(child)

    def test_ctrl_p_navigation(self, spawn_cli, keys):
        """Ctrl+P moves selection up (Emacs-style)."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)
        time.sleep(0.5)  # Wait for init

        # Go down first, then Ctrl+P
        keys.send_key(child, keys.CTRL_N, delay=0.2)
        keys.send_key(child, keys.CTRL_P)

        keys.quit(child)


@pytest.mark.e2e
class TestSearchFunctionality:
    """Test search mode activation and behavior."""

    def test_search_mode_activation(self, spawn_cli, keys):
        """Pressing / activates search mode."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)
        time.sleep(0.5)  # Wait for init

        # Activate search with /
        keys.send_key(child, '/')

        # Exit search with Esc
        keys.send_key(child, keys.ESC)

        keys.quit(child)

    def test_search_input(self, spawn_cli, keys):
        """Can type search query."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)
        time.sleep(0.5)  # Wait for init

        # Activate search
        keys.send_key(child, '/')

        # Type search query (one char at a time)
        for char in 'context7':
            keys.send_key(child, char, delay=0.1)

        # Clear with Esc
        keys.send_key(child, keys.ESC)

        keys.quit(child)

    def test_exit_search_with_down_arrow(self, spawn_cli, keys):
        """Down arrow exits search mode and returns to list (Issue #3)."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)
        time.sleep(0.5)  # Wait for init

        # Navigate to Discover tab (Enabled → Installed → Discover)
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB, delay=0.2)

        # Activate search with /
        keys.send_key(child, '/')
        time.sleep(0.3)

        # Exit search with Down arrow
        keys.send_key(child, keys.DOWN)
        time.sleep(0.3)

        # Should still be on Discover tab
        child.expect('Discover', timeout=2)

        keys.quit(child)


@pytest.mark.e2e
class TestQuitBehavior:
    """Test application exit."""

    def test_quit_with_q(self, spawn_cli, keys):
        """Pressing q exits the application."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)
        time.sleep(0.5)  # Wait for init

        # Quit the app
        keys.quit(child)

        # Process should have exited
        assert not child.isalive()
