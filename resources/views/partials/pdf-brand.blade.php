@php
    $brandParts = \App\Services\PlatformSettings::brandNameParts();
    $siteHost = \App\Services\PlatformSettings::siteHost();
@endphp
<div class="brand">
    {{ $brandParts['first'] }}@if($brandParts['rest'] !== '')<span> {{ $brandParts['rest'] }}</span>@endif
</div>
<div class="muted">{{ $siteHost }}</div>
