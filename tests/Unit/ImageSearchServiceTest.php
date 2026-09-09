<?php

namespace Tests\Unit;

use App\Services\ImageSearchService;
use PHPUnit\Framework\TestCase;

class ImageSearchServiceTest extends TestCase
{
    public function test_compare_allows_moderate_dhash_distance(): void
    {
        $service = new ImageSearchService;
        $hist = array_fill(0, 64, 1 / 64);

        $a = ['histogram' => $hist, 'dhash' => str_repeat('0', 64)];
        $b = [
            'histogram' => $hist,
            'dhash' => str_repeat('0', 50).str_repeat('1', 14),
        ];

        $this->assertGreaterThan(0.68, $service->compareSignatures($a, $b));
    }

    public function test_compare_rejects_far_dhash_distance(): void
    {
        $service = new ImageSearchService;
        $hist = array_fill(0, 64, 1 / 64);

        $a = ['histogram' => $hist, 'dhash' => str_repeat('0', 64)];
        $b = [
            'histogram' => $hist,
            'dhash' => str_repeat('1', 64),
        ];

        $this->assertSame(0.0, $service->compareSignatures($a, $b));
    }

    public function test_is_valid_signature_rejects_zero_fingerprint(): void
    {
        $service = new ImageSearchService;

        $this->assertFalse($service->isValidSignature([
            'histogram' => array_fill(0, 64, 0.0),
            'dhash' => str_repeat('0', 64),
        ]));
    }

    public function test_is_valid_signature_accepts_normal_fingerprint(): void
    {
        $service = new ImageSearchService;

        $this->assertTrue($service->isValidSignature([
            'histogram' => array_fill(0, 64, 1 / 64),
            'dhash' => str_repeat('01', 32),
        ]));
    }
}
