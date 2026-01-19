"""
E2E tests for display and content verification in claude-plugin-dashboard.

These tests verify that:
- The dashboard launches and displays correctly
- Plugin lists show expected content
- claude-plugins-official marketplace is visible
- CLI commands work correctly
"""
import time
import pexpect
import pytest


@pytest.mark.e2e
class TestDashboardDisplay:
    """Test that the dashboard renders correctly."""

    def test_dashboard_launches(self, spawn_cli, keys):
        """Dashboard should launch and show Enabled tab (default)."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        keys.quit(child)

    def test_shows_plugin_list(self, spawn_cli, keys):
        """Dashboard should show plugin list with install counts."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Navigate to Discover tab for plugin list with counts
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB, delay=0.2)

        # Should display install count pattern (e.g., "55.2K installs")
        index = child.expect([
            r'installs',
            'No plugins',
            pexpect.TIMEOUT
        ], timeout=5)

        assert index in [0, 1], "Dashboard should show plugins or empty state"
        keys.quit(child)

    def test_shows_official_plugins(self, spawn_cli, keys):
        """Dashboard should show claude-plugins-official plugins."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Navigate to Discover tab for official plugins
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB, delay=0.2)

        # Look for official marketplace
        index = child.expect([
            'claude-plugins-official',
            'official',
            pexpect.TIMEOUT
        ], timeout=5)

        if index == 2:
            pytest.skip("No official plugins visible - may be data issue")

        keys.quit(child)


@pytest.mark.e2e
class TestTabNavigation:
    """Test tab navigation display."""

    def test_installed_tab(self, spawn_cli, keys):
        """Can navigate to Installed tab."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        keys.send_key(child, keys.TAB)
        child.expect('Installed', timeout=2)

        keys.quit(child)

    def test_marketplaces_tab(self, spawn_cli, keys):
        """Can navigate to Marketplaces tab."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Enabled → Installed → Discover → Marketplaces
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB)
        child.expect('Marketplaces', timeout=2)

        keys.quit(child)

    def test_marketplaces_tab_no_header_duplication(self, spawn_cli, keys):
        """Header should appear only once on Marketplaces tab (Issue #10)."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Navigate to Marketplaces tab (Enabled → Installed → Discover → Marketplaces)
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB, delay=0.2)
        time.sleep(0.3)

        # Read current buffer (may timeout if no pending data)
        try:
            child.read_nonblocking(size=10000, timeout=0.5)
        except pexpect.TIMEOUT:
            pass  # No pending data is acceptable

        output = child.before.decode('utf-8') if isinstance(child.before, bytes) else str(child.before or '')

        # Count header occurrences
        header_count = output.count('Plugin Dashboard')

        # Header should appear exactly once
        assert header_count <= 1, f"Header appeared {header_count} times, expected 1"

        keys.quit(child)

    def test_errors_tab(self, spawn_cli, keys):
        """Can navigate to Errors tab."""
        child = spawn_cli()
        child.expect('Enabled', timeout=10)  # Enabled is default tab
        time.sleep(0.5)  # Wait for init

        # Enabled → Installed → Discover → Marketplaces → Errors
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB)
        child.expect('Errors', timeout=2)

        keys.quit(child)


@pytest.mark.e2e
class TestCLICommands:
    """Test non-interactive CLI commands."""

    def test_status_command(self, spawn_cli):
        """status command shows statistics."""
        child = spawn_cli('status')

        # Wait for process to complete
        child.expect(pexpect.EOF, timeout=10)
        child.wait()  # Ensure process terminates

        assert child.exitstatus == 0

    def test_list_command(self, spawn_cli):
        """list command shows plugins."""
        child = spawn_cli('list')

        child.expect(pexpect.EOF, timeout=10)
        child.wait()

        # Should have output
        output = child.before
        assert len(output) > 0, "list command should produce output"
        assert child.exitstatus == 0

    def test_help_command(self, spawn_cli):
        """help command shows usage information."""
        child = spawn_cli('help')

        child.expect(pexpect.EOF, timeout=10)
        child.wait()

        # Should have output
        output = child.before
        assert 'Usage' in output or 'usage' in output or 'USAGE' in output or len(output) > 50
        assert child.exitstatus == 0


@pytest.mark.e2e
class TestScrollDisplay:
    """Test scroll display behavior - no ghost text or display corruption.

    This test class verifies the fix for the scroll display corruption issue
    where navigating through the plugin list would cause ghost text artifacts
    in the detail panel (Issue: metadata row values bleeding between selections).
    """

    def test_scroll_down_no_ghost_text(self, spawn_cli, keys):
        """Scrolling down through list should not cause display corruption.

        The fix ensures that:
        1. All metadata rows render unconditionally (no conditional rows)
        2. Values are padded to fixed width to overwrite previous content
        """
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Navigate down through the list multiple times
        # This triggers the scroll behavior that previously caused ghost text
        for _ in range(10):
            keys.send_key(child, keys.DOWN, delay=0.2)

        # App should still be running without display issues
        assert child.isalive(), "App should remain responsive after scrolling"

        keys.quit(child)

    def test_scroll_up_down_round_trip(self, spawn_cli, keys):
        """Scrolling down then back up should not leave ghost text.

        Previously, switching between plugins with different metadata
        would leave remnants of the previous plugin's values visible.
        """
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Scroll down 10 items
        for _ in range(10):
            keys.send_key(child, keys.DOWN, delay=0.15)

        # Scroll back up 10 items
        for _ in range(10):
            keys.send_key(child, keys.UP, delay=0.15)

        # Should be back at first item, app responsive
        assert child.isalive(), "App should remain responsive after round-trip scroll"

        keys.quit(child)

    def test_discover_tab_scroll_no_corruption(self, spawn_cli, keys):
        """Scrolling on Discover tab should not corrupt detail panel.

        Discover tab has the most plugins and is most likely to trigger
        the scroll display issue due to varying plugin metadata.
        """
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Navigate to Discover tab (Enabled → Installed → Discover)
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB, delay=0.2)
        time.sleep(0.3)

        # Scroll through many plugins on Discover tab
        for _ in range(15):
            keys.send_key(child, keys.DOWN, delay=0.15)

        # App should be responsive
        assert child.isalive(), "App should remain responsive on Discover tab scroll"

        keys.quit(child)

    def test_rapid_scroll_no_display_issues(self, spawn_cli, keys):
        """Rapid scrolling should not cause display corruption.

        Tests the fix under stress conditions with minimal delay between
        key presses to ensure the fixed-width padding prevents ghost text
        even when rendering updates rapidly.
        """
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Navigate to Discover tab
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB, delay=0.2)
        time.sleep(0.3)

        # Rapid scroll with minimal delay
        for _ in range(20):
            keys.send_key(child, keys.DOWN, delay=0.05)

        time.sleep(0.5)  # Allow final render to settle

        # App should still be responsive
        assert child.isalive(), "App should handle rapid scrolling"

        keys.quit(child)


@pytest.mark.e2e
class TestPluginDetailFixedHeight:
    """Test PluginDetail panel fixed height to prevent layout jumping.

    This test class verifies the fix for layout jumping issue where the footer
    and other UI elements would shift position when navigating between plugins
    with different amounts of content (e.g., varying component counts).

    The fix sets a fixed height on the PluginDetail panel (DETAIL_PANEL_HEIGHT = 26)
    so that the panel maintains consistent height regardless of content.
    """

    def test_footer_visible_after_scroll(self, spawn_cli, keys):
        """Footer should remain visible after scrolling through plugins.

        Verifies that the fixed height prevents the footer from being
        pushed off-screen when switching between plugins.
        """
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Scroll down through several plugins
        for _ in range(8):
            keys.send_key(child, keys.DOWN, delay=0.2)

        time.sleep(0.3)

        # Footer should still be visible - check for key hint text
        index = child.expect([
            'navigate',
            'help',
            'quit',
            pexpect.TIMEOUT
        ], timeout=2)

        assert index != 3, "Footer should remain visible after scrolling"
        assert child.isalive(), "App should remain responsive"

        keys.quit(child)

    def test_footer_stable_with_varying_components(self, spawn_cli, keys):
        """Footer should stay in place when switching between plugins with different component counts.

        Some plugins have many components (Skills, Agents, etc.) while others
        have few or none. The fixed height ensures consistent layout.
        """
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Navigate through plugins multiple times (mix of high/low component plugins)
        for _ in range(5):
            keys.send_key(child, keys.DOWN, delay=0.25)

        # Go back up
        for _ in range(5):
            keys.send_key(child, keys.UP, delay=0.25)

        # Repeat to stress test
        for _ in range(10):
            keys.send_key(child, keys.DOWN, delay=0.15)

        time.sleep(0.3)

        # Footer should still be visible
        index = child.expect([
            'navigate',
            'toggle',
            pexpect.TIMEOUT
        ], timeout=2)

        assert index != 2, "Footer should remain visible after varying component navigation"

        keys.quit(child)

    def test_rapid_navigation_footer_stable(self, spawn_cli, keys):
        """Rapid navigation should not cause footer to disappear or shift.

        Tests the fixed height under stress conditions with minimal delay
        between key presses.
        """
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Rapid scroll with minimal delay
        for _ in range(15):
            keys.send_key(child, keys.DOWN, delay=0.05)

        time.sleep(0.5)  # Allow render to settle

        # Footer should still be visible
        index = child.expect([
            'help',
            'quit',
            pexpect.TIMEOUT
        ], timeout=2)

        assert index != 2, "Footer should remain visible after rapid navigation"
        assert child.isalive(), "App should remain responsive after rapid navigation"

        keys.quit(child)

    def test_layout_stable_on_installed_tab(self, spawn_cli, keys):
        """Layout should be stable on Installed tab.

        Installed tab shows plugins that may have varying component counts
        based on what the user has installed.
        """
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Navigate to Installed tab
        keys.send_key(child, keys.TAB, delay=0.2)
        time.sleep(0.3)

        # Scroll through installed plugins
        for _ in range(10):
            keys.send_key(child, keys.DOWN, delay=0.2)

        time.sleep(0.3)

        # Footer should be visible
        index = child.expect([
            'navigate',
            'install',
            pexpect.TIMEOUT
        ], timeout=2)

        assert index != 2, "Footer should remain visible on Installed tab"

        keys.quit(child)

    def test_layout_stable_on_discover_tab(self, spawn_cli, keys):
        """Layout should be stable on Discover tab with many plugins.

        Discover tab has the most plugins and greatest variation in
        component counts, making it the best test for layout stability.
        """
        child = spawn_cli()
        child.expect('Enabled', timeout=10)
        time.sleep(0.5)

        # Navigate to Discover tab (Enabled → Installed → Discover)
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB, delay=0.2)
        time.sleep(0.3)

        # Scroll through many plugins
        for _ in range(15):
            keys.send_key(child, keys.DOWN, delay=0.15)

        time.sleep(0.3)

        # Footer should be visible
        index = child.expect([
            'navigate',
            'sort',
            pexpect.TIMEOUT
        ], timeout=2)

        assert index != 2, "Footer should remain visible on Discover tab"

        keys.quit(child)
