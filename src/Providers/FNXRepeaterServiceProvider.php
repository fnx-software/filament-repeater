<?php

declare(strict_types=1);

namespace FnxSoftware\FNXRepeater\Providers;

use Filament\Support\Assets\Css;
use Filament\Support\Assets\Js;
use Filament\Support\Facades\FilamentAsset;
use Illuminate\Support\ServiceProvider;

final class FNXRepeaterServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadTranslationsFrom(__DIR__ . '/../../lang', 'fnx-repeater');

        FilamentAsset::register([
            Js::make('fnx-repeater', __DIR__ . '/../../dist/fnx-repeater.js')
                ->loadedOnRequest(),
            Css::make('fnx-repeater', __DIR__ . '/../../resources/css/fnx-repeater.css'),
        ], package: 'fnx-software/filament-repeater');
    }
}
