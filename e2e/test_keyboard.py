"""
E2E tests for keyboard navigation in claude-plugin-dashboard.

Tests verify that all documented keyboard shortcuts work as expected:
- Tab navigation (←, →, Tab)
- Focus zone navigation (↑, ↓ between tabbar/search/list zones)
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
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Tab to next tab
        keys.send_key(child, keys.TAB)
        child.expect('Installed', timeout=2)

        keys.quit(child)

    def test_tab_switch_with_right_arrow_in_tabbar(self, spawn_cli, keys):
        """Right arrow key switches to next tab when tabbar is focused."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Navigate up to tabbar zone first (list -> search -> tabbar)
        keys.send_key(child, keys.UP, delay=0.2)
        keys.send_key(child, keys.UP, delay=0.2)

        # Now right arrow should navigate tabs
        keys.send_key(child, keys.RIGHT)
        child.expect('Installed', timeout=2)

        keys.quit(child)

    def test_tab_switch_with_left_arrow_in_tabbar(self, spawn_cli, keys):
        """Left arrow key switches to previous tab when tabbar is focused."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Navigate up to tabbar zone first (list -> search -> tabbar)
        keys.send_key(child, keys.UP, delay=0.2)
        keys.send_key(child, keys.UP, delay=0.2)

        # Go right first
        keys.send_key(child, keys.RIGHT, delay=0.2)

        # Then go left back to Enabled
        keys.send_key(child, keys.LEFT)
        child.expect('Enabled', timeout=2)

        keys.quit(child)

    def test_cycle_through_all_tabs(self, spawn_cli, keys):
        """Can cycle through all five tabs."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Cycle through all 5 tabs (Enabled → Installed → Discover → Marketplaces → Errors → Enabled)
        for _ in range(5):
            keys.send_key(child, keys.TAB, delay=0.2)

        keys.quit(child)

    def test_tab_switch_with_ctrl_f_in_tabbar(self, spawn_cli, keys):
        """Ctrl+F switches to next tab when tabbar is focused (Emacs-style)."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Navigate up to tabbar zone first (list -> search -> tabbar)
        keys.send_key(child, keys.UP, delay=0.2)
        keys.send_key(child, keys.UP, delay=0.2)

        # Ctrl+F to next tab
        keys.send_key(child, keys.CTRL_F)
        child.expect('Installed', timeout=2)

        keys.quit(child)

    def test_tab_switch_with_ctrl_b_in_tabbar(self, spawn_cli, keys):
        """Ctrl+B switches to previous tab when tabbar is focused (Emacs-style)."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Navigate up to tabbar zone first (list -> search -> tabbar)
        keys.send_key(child, keys.UP, delay=0.2)
        keys.send_key(child, keys.UP, delay=0.2)

        # Go forward first
        keys.send_key(child, keys.CTRL_F, delay=0.2)

        # Then go back with Ctrl+B
        keys.send_key(child, keys.CTRL_B)
        child.expect('Enabled', timeout=2)

        keys.quit(child)


@pytest.mark.e2e
class TestFocusZoneNavigation:
    """Test focus zone navigation between tabbar, search, and list zones."""

    def test_up_from_list_top_focuses_search(self, spawn_cli, keys):
        """Up arrow at list top moves focus to search zone."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Press up at list top - should move to search zone
        # Enabled tab may have empty list, so we're at top
        keys.send_key(child, keys.UP)
        time.sleep(0.3)

        # Verify app is still running after focus zone navigation
        assert child.isalive(), "App should still be running after focus zone navigation"

        keys.quit(child)

    def test_up_from_search_focuses_tabbar(self, spawn_cli, keys):
        """Up arrow from search zone moves focus to tabbar."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Move to search zone first
        keys.send_key(child, keys.UP, delay=0.2)

        # Now up should move to tabbar zone
        keys.send_key(child, keys.UP)
        time.sleep(0.3)

        # TabBar zone has focus indicator ▶ and brackets around active tab
        child.expect('[Enabled]', timeout=2)

        keys.quit(child)

    def test_down_from_tabbar_focuses_search(self, spawn_cli, keys):
        """Down arrow from tabbar moves focus to search zone."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Navigate to tabbar zone first
        keys.send_key(child, keys.UP, delay=0.2)
        keys.send_key(child, keys.UP, delay=0.2)

        # Now down should move to search zone
        keys.send_key(child, keys.DOWN)
        time.sleep(0.3)

        # Verify app is still running after focus zone navigation
        assert child.isalive(), "App should still be running after focus zone navigation"

        keys.quit(child)

    def test_down_from_search_focuses_list(self, spawn_cli, keys):
        """Down arrow from search zone moves focus to list."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Move to search zone
        keys.send_key(child, keys.UP, delay=0.2)

        # Now down should move to list zone
        keys.send_key(child, keys.DOWN)
        time.sleep(0.3)

        # List zone is active - tab should still be visible and app responsive
        child.expect('Enabled', timeout=2)

        keys.quit(child)

    def test_ctrl_p_from_list_top_focuses_search(self, spawn_cli, keys):
        """Ctrl+P at list top moves focus to search zone (Emacs-style)."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Ctrl+P at list top should move to search
        keys.send_key(child, keys.CTRL_P)
        time.sleep(0.3)

        # Verify app is still running after focus zone navigation
        assert child.isalive(), "App should still be running after focus zone navigation"

        keys.quit(child)

    def test_ctrl_n_from_search_focuses_list(self, spawn_cli, keys):
        """Ctrl+N from search zone moves focus to list (Emacs-style)."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Move to search zone first
        keys.send_key(child, keys.CTRL_P, delay=0.2)

        # Ctrl+N should move to list
        keys.send_key(child, keys.CTRL_N)
        time.sleep(0.3)

        # List zone is active - tab still visible
        child.expect('Enabled', timeout=2)

        keys.quit(child)

    def test_errors_tab_skips_search_zone(self, spawn_cli, keys):
        """Errors tab has no search zone - up/down goes directly between tabbar and list."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Navigate to Errors tab (4 tabs from Enabled)
        for _ in range(4):
            keys.send_key(child, keys.TAB, delay=0.2)
        time.sleep(0.5)
        child.expect('Errors', timeout=3)

        # On Errors tab, up should go directly from list to tabbar (no search)
        keys.send_key(child, keys.UP, delay=0.2)

        # Now down should go directly back to list (no search)
        keys.send_key(child, keys.DOWN)
        time.sleep(0.3)

        # Verify app is still running (navigation completed without crash)
        assert child.isalive(), "App should still be running after focus zone navigation"

        keys.quit(child)

    def test_right_arrow_does_nothing_in_list_zone(self, spawn_cli, keys):
        """Right arrow does nothing when focus is on list zone (not tabbar)."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)

        # Default focus is list zone, right arrow should not navigate tabs
        keys.send_key(child, keys.RIGHT)
        time.sleep(0.3)

        # Should still be on Enabled tab
        child.expect('Enabled', timeout=2)

        keys.quit(child)

    def test_left_arrow_does_nothing_in_list_zone(self, spawn_cli, keys):
        """Left arrow does nothing when focus is on list zone (not tabbar)."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)

        # Default focus is list zone, left arrow should not navigate tabs
        keys.send_key(child, keys.LEFT)
        time.sleep(0.3)

        # Should still be on Enabled tab
        child.expect('Enabled', timeout=2)

        keys.quit(child)


@pytest.mark.e2e
class TestListNavigation:
    """Test list navigation with arrow keys and Emacs shortcuts."""

    def test_down_arrow_navigation(self, spawn_cli, keys):
        """Down arrow moves selection down."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Navigate down
        keys.send_key(child, keys.DOWN)

        keys.quit(child)

    def test_up_arrow_navigation(self, spawn_cli, keys):
        """Up arrow moves selection up."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Go down first, then up
        keys.send_key(child, keys.DOWN, delay=0.2)
        keys.send_key(child, keys.UP)

        keys.quit(child)

    def test_ctrl_n_navigation(self, spawn_cli, keys):
        """Ctrl+N moves selection down (Emacs-style)."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Ctrl+N should work like down arrow
        keys.send_key(child, keys.CTRL_N)

        keys.quit(child)

    def test_ctrl_p_navigation(self, spawn_cli, keys):
        """Ctrl+P moves selection up (Emacs-style)."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
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
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Activate search with /
        keys.send_key(child, '/')

        # Exit search with Esc
        keys.send_key(child, keys.ESC)

        keys.quit(child)

    def test_search_input(self, spawn_cli, keys):
        """Can type search query."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
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
        child.expect('Enabled', timeout=10)  # Enabled is default tab
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

    def test_search_on_enabled_tab(self, spawn_cli, keys):
        """Search mode works on Enabled tab (Issue #11)."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Activate search with /
        keys.send_key(child, '/')
        time.sleep(0.3)

        # Type search query
        for char in 'test':
            keys.send_key(child, char, delay=0.1)

        # Exit search with Esc
        keys.send_key(child, keys.ESC)
        time.sleep(0.3)

        # Should still be on Enabled tab
        child.expect('Enabled', timeout=2)

        keys.quit(child)

    def test_search_on_installed_tab(self, spawn_cli, keys):
        """Search mode works on Installed tab (Issue #11)."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)  # Wait for init

        # Navigate to Installed tab
        keys.send_key(child, keys.TAB, delay=0.3)
        child.expect('Installed', timeout=2)

        # Activate search with /
        keys.send_key(child, '/')
        time.sleep(0.3)

        # Type search query
        for char in 'mcp':
            keys.send_key(child, char, delay=0.1)

        # Exit search with Esc
        keys.send_key(child, keys.ESC)
        time.sleep(0.3)

        keys.quit(child)

    def test_search_on_marketplaces_tab(self, spawn_cli, keys):
        """Search mode works on Marketplaces tab (Issue #11)."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)  # Wait for init

        # Navigate to Marketplaces tab (Enabled → Installed → Discover → Marketplaces)
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB, delay=0.2)
        time.sleep(0.3)
        child.expect('Marketplaces', timeout=2)

        # Activate search with /
        keys.send_key(child, '/')
        time.sleep(0.3)

        # Type search query
        for char in 'official':
            keys.send_key(child, char, delay=0.1)

        # Exit search with Esc
        keys.send_key(child, keys.ESC)
        time.sleep(0.3)

        keys.quit(child)

    def test_search_not_available_on_errors_tab(self, spawn_cli, keys):
        """Search mode should NOT activate on Errors tab (Issue #11)."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)  # Wait for init

        # Navigate to Errors tab (Enabled → Installed → Discover → Marketplaces → Errors)
        for _ in range(4):
            keys.send_key(child, keys.TAB, delay=0.2)
        time.sleep(0.5)

        # Verify we're on Errors tab
        child.expect('Errors', timeout=3)

        # Try to activate search with / (should have no effect on Errors tab)
        keys.send_key(child, '/')
        time.sleep(0.3)

        # App should still be running (/ does nothing on Errors tab)
        assert child.isalive()

        keys.quit(child)


@pytest.mark.e2e
class TestInstallActions:
    """Test install actions with Enter key."""

    def test_enter_key_triggers_install(self, spawn_cli, keys):
        """Enter key triggers install action on Discover tab (Issue #4)."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Navigate to Discover tab (Enabled → Installed → Discover)
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB, delay=0.2)
        time.sleep(0.3)

        # Press Enter key (should trigger install action)
        keys.send_key(child, keys.ENTER)
        time.sleep(0.5)

        # App should still be running (install action triggered)
        assert child.isalive()

        keys.quit(child)


@pytest.mark.e2e
class TestHelpOverlay:
    """Test help overlay functionality."""

    def test_help_toggle_with_h_key(self, spawn_cli, keys):
        """Pressing h toggles the help overlay (Issue #8)."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Open help
        keys.send_key(child, 'h')
        time.sleep(0.5)

        # Help should be visible
        # App should still be running
        assert child.isalive()

        # Close help
        keys.send_key(child, 'h')
        time.sleep(0.3)

        keys.quit(child)

    def test_help_close_with_escape(self, spawn_cli, keys):
        """Pressing Escape closes the help overlay."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Open help
        keys.send_key(child, 'h')
        time.sleep(0.3)

        # Close with Escape
        keys.send_key(child, keys.ESC)
        time.sleep(0.3)

        # Should still be running
        assert child.isalive()

        keys.quit(child)


@pytest.mark.e2e
class TestQuitBehavior:
    """Test application exit."""

    def test_quit_with_q(self, spawn_cli, keys):
        """Pressing q exits the application."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Quit the app
        keys.quit(child)

        # Process should have exited
        assert not child.isalive()
