<?php
/**
 * Component Library WordPress Integration
 *
 * Loads the library's theme.json as a default base layer and enqueues
 * design token CSS variables. Automatically loads tokens.wp.css
 * (themeable) if present, otherwise falls back to tokens.css (locked).
 *
 * Setup:
 *   1. Copy this file, theme.json, and your token CSS file into your theme
 *      (e.g. assets/c2b/)
 *   2. Add to your theme's functions.php:
 *      require_once get_template_directory() . '/assets/c2b/integrate.php';
 *
 * @package component2block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Inject the library's theme.json as a WordPress default base layer.
 *
 * This registers design tokens (colors, spacing, fonts, etc.) as
 * WordPress presets. The active theme's theme.json overrides any
 * values defined here.
 */
add_filter( 'wp_theme_json_data_default', function ( $theme_json ) {
	$library_json_path = __DIR__ . '/theme.json';

	if ( ! file_exists( $library_json_path ) ) {
		return $theme_json;
	}

	$library_data = json_decode(
		file_get_contents( $library_json_path ),
		true
	);

	if ( ! is_array( $library_data ) ) {
		return $theme_json;
	}

	return $theme_json->update_with( $library_data );
} );

/**
 * Enqueue design token CSS variables.
 *
 * Prefers tokens.wp.css (themeable — maps to --wp--preset--* variables)
 * over tokens.css (locked — hardcoded values). Both are looked for in
 * the same directory as this file.
 *
 * Loads on both the frontend and inside the block editor iframe.
 */
$c2b_enqueue_tokens = function () {
	if ( file_exists( __DIR__ . '/tokens.wp.css' ) ) {
		$file = 'tokens.wp.css';
	} elseif ( file_exists( __DIR__ . '/tokens.css' ) ) {
		$file = 'tokens.css';
	} else {
		return;
	}

	$base_url = content_url(
		str_replace(
			wp_normalize_path( WP_CONTENT_DIR ),
			'',
			wp_normalize_path( __DIR__ )
		)
	);

	wp_enqueue_style(
		'c2b-tokens',
		$base_url . '/' . $file,
		array(),
		filemtime( __DIR__ . '/' . $file )
	);
};

add_action( 'wp_enqueue_scripts', $c2b_enqueue_tokens );
add_action( 'enqueue_block_editor_assets', $c2b_enqueue_tokens );

/**
 * Locked mode enforcement.
 *
 * When the library was built with wpThemeable: false (detected by the
 * absence of tokens.wp.css), enforce design system restrictions at the
 * theme layer so the theme's theme.json cannot override them:
 *
 *   - Layout sizes (contentSize, wideSize) are locked
 *   - Custom color/gradient creation is disabled in the Site Editor
 *
 * When wpThemeable: true (tokens.wp.css exists), none of these
 * restrictions apply — the theme has full control.
 */
if ( ! file_exists( __DIR__ . '/tokens.wp.css' ) ) {
	add_filter( 'wp_theme_json_data_theme', function ( $theme_json ) {
		$library_json_path = __DIR__ . '/theme.json';

		if ( ! file_exists( $library_json_path ) ) {
			return $theme_json;
		}

		$library_data = json_decode(
			file_get_contents( $library_json_path ),
			true
		);

		if ( ! is_array( $library_data ) ) {
			return $theme_json;
		}

		$enforced = array(
			'version'  => $library_data['version'] ?? 3,
			'settings' => array(
				'color' => array(
					'custom'         => false,
					'customDuotone'  => false,
					'customGradient' => false,
				),
			),
		);

		// Lock layout sizes if defined
		if ( isset( $library_data['settings']['layout'] ) ) {
			$enforced['settings']['layout'] = $library_data['settings']['layout'];
		}

		return $theme_json->update_with( $enforced );
	} );
}
